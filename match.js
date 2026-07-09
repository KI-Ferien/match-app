// netlify/functions/match.js

function getFallbackData(destination, explanation, signs) {
  return {
    destination: destination,
    explanation: explanation || `Ein vorbestimmter Seelenort für deine Konstellation der Sternzeichen ${signs || ''}.`,
    bestTimeTip: "Mai bis September",
    packliste: ["Premium-Gepäck", "Bequeme Reiseschuhe", "Sonnenbrille"],
    cta_text: "Ferien planen",
    affiliate_suggestions: []
  };
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
    }
    
    const payload = JSON.parse(event.body);
    const signs = Array.isArray(payload.signs) ? payload.signs.join(', ') : 'Keine spezifischen';
    const participants = Number(payload.participants) || 2;
    const vibe = payload.vibe || 'Fließende Balance';
    const budget = payload.budget || 'Goldene Mitte';
    const distance = payload.distance || 'Kontinentale Weite';
    const transport = payload.transport || 'Flug der Falken';

    const apiKey = process.env.MISTRAL_API_KEY;
    
    // Lokaler Fallback-Sicherheitsgurt
    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackData(
        "Mallorca", 
        `Das Orakel ruht gerade mangels API-Schlüssel. Dies ist eine Test-Empfehlung für die Sternzeichen ${signs} für deine Ferien.`, 
        signs
      );

      const marker = "698672";
      const trs = "492044";
      const destEnc = encodeURIComponent("Mallorca");
      const klookTarget = encodeURIComponent(`https://www.klook.com/search/result/?query=${destEnc}`);
      const getTransferTarget = encodeURIComponent(`https://gettransfer.com/`);
      const wpTarget = encodeURIComponent(`https://www.welcomepickups.com/mallorca/`);

      fallback.affiliate_suggestions = [
        { 
          type: 'activity', 
          label: 'Klook Erlebnisse in Mallorca', 
          affiliate_url: `https://tp.media/r?campaign_id=137&marker=${marker}&p=4110&trs=${trs}&u=${klookTarget}` 
        },
        { 
          type: 'transfer', 
          label: 'GetTransfer Fahrt', 
          affiliate_url: `https://tp.media/r?campaign_id=147&marker=${marker}&p=4439&trs=${trs}&u=${getTransferTarget}` 
        },
        { 
          type: 'pickup', 
          label: 'Welcome Pickups', 
          affiliate_url: `https://tp.media/r?campaign_id=627&marker=${marker}&p=8919&trs=${trs}&u=${wpTarget}` 
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallback)
      };
    }

    const prompt = `Du bist ein hochentwickeltes astrologisches Orakel für Ferien. /astro
    Analysiere folgende Parameter für ${participants} Personen der Sternzeichen ${signs}:
    Erlebnis-Wunsch: ${vibe}
    Budget-Pfad: ${budget}
    Gewünschte Entfernung: ${distance}
    Art der Fortbewegung: ${transport}
    
    WICHTIGE REGELN FÜR DEINE EMPFEHLUNG:
    1. Geografische Bindung: "Heimatliche Gefilde" und "Nachbarreiche" bedeuten ZWINGEND DACH-Region. "Kontinentale Weite" bedeutet ZWINGEND Europa. Alles andere ist weltweit. 
    2. Die Packliste MUSS 3 REALE, hochprofessionelle Ausrüstungsgegenstände enthalten. NENNE KEINE KAMERAS. Nenne stattdessen exklusives Premium-Gepäck, High-Tech Kleidung oder Gadgets. ERFINDE KEINE esoterischen Gegenstände.
    3. Die Begründung ('explanation') MUSS ZWINGEND diese Quellen einbinden: 
       - Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973).
       - Das Konzept des Atman (Hinduismus, Merriam-Webster 2003).
    4. Nutze immer das Wort "Ferien".
    5. Beachte simulierte Reise- und Sicherheitswarnungen.
    
    Antworte AUSSCHLIESSLICH als JSON-Objekt ohne Markdown:
    {
      "destination": "Name des Ziels (NUR die Stadt oder Insel, z.B. 'Mallorca' oder 'Paris')",
      "explanation": "Tiefgründige Begründung inkl. Sternzeichen, Buddha (Yamamoto 1973) und Atman (Webster 2003).",
      "bestTimeTip": "Beste Reisezeit",
      "packliste": ["Reales Profi-Item 1", "Reales Profi-Item 2", "Reales Profi-Item 3"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    let parsed = null;

    try {
      const mistralRes = await globalThis.fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey.trim()}` 
        },
        body: JSON.stringify({ 
          model: "mistral-small-latest", 
          messages: [{ role: "user", content: prompt }], 
          temperature: 0.7 
        })
      });

      if (!mistralRes.ok) throw new Error(`API error ${mistralRes.status}`);

      const mistralData = await mistralRes.json();
      let rawText = mistralData.choices[0].message.content.trim();
      
      const backtickPattern = '\\x60\\x60\\x60';
      const fenceRegex = new RegExp(`${backtickPattern}(?:json)?\\s*([\\s\\S]*?)\\s*${backtickPattern}`, 'i');
      const fenceMatch = rawText.match(fenceRegex);

      if (fenceMatch && fenceMatch[1]) rawText = fenceMatch[1].trim();
      if (!rawText.startsWith('{')) {
        const firstJson = rawText.match(/\{[\s\S]*?\}/);
        if (firstJson) rawText = firstJson[0];
      }

      parsed = JSON.parse(rawText);

    } catch (apiError) {
      parsed = {
        destination: "Salzburg",
        explanation: `Ein vorbestimmter Seelenort für die Konstellation der Sternzeichen ${signs}. Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Kosho Yamamoto 1973), liegt wahres Glück in der bewussten Einkehr. Das Konzept des Atman (Merriam-Webster 2003) spiegelt sich in den majestätischen Bergen wider. Ein idealer Kraftort für deine Ferien.`,
        bestTimeTip: "Mai bis Oktober sowie zur magischen Adventszeit.",
        packliste: ["Premium-Wanderschuhe", "Winddichte Softshelljacke", "Stilvolles Reisetagebuch"],
        cta_text: "Ferien Erlebnisse buchen"
      };
    }

    const destRaw = parsed.destination || 'Mallorca';
    const destEnc = encodeURIComponent(destRaw);
    const destSlug = destRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const marker = "698672";
    const trs = "492044";

    const klookTarget = encodeURIComponent(`https://www.klook.com/search/result/?query=${destEnc}`);
    const getTransferTarget = encodeURIComponent(`https://gettransfer.com/`);
    const wpTarget = encodeURIComponent(`https://www.welcomepickups.com/${destSlug}/`);

    parsed.affiliate_suggestions = [
      { 
        type: 'activity', 
        label: `Klook Erlebnisse in ${destRaw}`, 
        affiliate_url: `https://tp.media/r?campaign_id=137&marker=${marker}&p=4110&trs=${trs}&u=${klookTarget}` 
      },
      { 
        type: 'transfer', 
        label: `GetTransfer Fahrt`, 
        affiliate_url: `https://tp.media/r?campaign_id=147&marker=${marker}&p=4439&trs=${trs}&u=${getTransferTarget}` 
      },
      { 
        type: 'pickup', 
        label: `Welcome Pickups`, 
        affiliate_url: `https://tp.media/r?campaign_id=627&marker=${marker}&p=8919&trs=${trs}&u=${wpTarget}` 
      }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    
  } catch (globalError) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: globalError.message }) 
    };
  }
};