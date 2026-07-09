// netlify/functions/match.js

function getFallbackData(destination, explanation, signs) {
  return {
    destination: destination,
    explanation: explanation || `Ein vorbestimmter Seelenort für deine Konstellation der Sternzeichen ${signs || ''}.`,
    bestTimeTip: "Mai bis September",
    packliste: ["Premium-Wanderschuhe", "Winddichte Softshelljacke", "Stilvolles Reisetagebuch"],
    cta_text: "Ferien Erlebnisse buchen",
    affiliate_suggestions: [
      { 
        type: 'activity', 
        label: 'Erlebnisse entdecken', 
        affiliate_url: 'https://tpk.lv/pXm2idkE' 
      },
      { 
        type: 'tiqets', 
        label: 'Tickets sichern', 
        affiliate_url: 'https://tiqets.tpk.lv/XxF1prij' 
      },
      { 
        type: 'transfer', 
        label: 'Transfer buchen', 
        affiliate_url: 'https://gettransfer.tpk.lv/mPE1eDIa' 
      }
    ]
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
    
    // 1. Fallback-Schutz (Kein API-Key in Netlify hinterlegt)
    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackData(
        "Salzburg", 
        `Das Orakel ruht gerade mangels API-Schlüssel auf Netlify. Dies ist eine astrologische Resonanz für die Sternzeichen ${signs} für deine Ferien. Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Kosho Yamamoto 1973), liegt wahres Glück in der bewussten Einkehr. Das Konzept des Atman (Merriam-Webster 2003) spiegelt sich in den majestätischen Bergen wider.`, 
        signs
      );
      return { statusCode: 200, headers, body: JSON.stringify(fallback) };
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
      "destination": "Name des Ziels (NUR die Stadt oder Insel, z.B. 'Salzburg' oder 'Mallorca')",
      "explanation": "Tiefgründige Begründung inkl. Sternzeichen, Buddha (Yamamoto 1973) und Atman (Webster 2003).",
      "bestTimeTip": "Beste Reisezeit",
      "packliste": ["Reales Profi-Item 1", "Reales Profi-Item 2", "Reales Profi-Item 3"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    let parsed = null;

    try {
      // Absicherung für alte Node-Versionen auf Netlify
      if (typeof globalThis.fetch !== 'function') {
        throw new Error("Node-Umgebung unterstützt kein natives Fetch.");
      }

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
      // 2. API- oder Umgebungsfehler Fallback (Immer noch ein valides JSON!)
      parsed = getFallbackData(
        "Salzburg",
        `Ein vorbestimmter Seelenort für die Konstellation der Sternzeichen ${signs}. Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Kosho Yamamoto 1973), liegt wahres Glück in der bewussten Einkehr. Das Konzept des Atman (Merriam-Webster 2003) spiegelt sich in den majestätischen Bergen wider. Ein idealer Kraftort für deine Ferien.`,
        signs
      );
    }

    // Falls die API erfolgreich war, aber keine Vorschläge angehängt hat:
    if (!parsed.affiliate_suggestions || parsed.affiliate_suggestions.length === 0) {
      parsed.affiliate_suggestions = [
        { type: 'activity', label: 'Erlebnisse entdecken', affiliate_url: 'https://tpk.lv/pXm2idkE' },
        { type: 'tiqets', label: 'Tickets sichern', affiliate_url: 'https://tiqets.tpk.lv/XxF1prij' },
        { type: 'transfer', label: 'Transfer buchen', affiliate_url: 'https://gettransfer.tpk.lv/mPE1eDIa' }
      ];
    }

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify(parsed) 
    };
    
  } catch (globalError) {
    // 3. Absoluter Notnagel, falls ALLES explodiert.
    // Selbst hier senden wir ein sauberes JSON zurück, damit reise.html niemals stirbt.
    const hardFallback = getFallbackData("Salzburg", `System-Notbetrieb aktiv.`, 'Widder');
    return { 
      statusCode: 200, // Wir erzwingen 200, damit die index.html nicht in den catch-Block springt!
      headers, 
      body: JSON.stringify(hardFallback) 
    };
  }
};
