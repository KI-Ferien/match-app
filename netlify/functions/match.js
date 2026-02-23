// netlify/functions/match.js
'use strict';

let fetchFn;
if (typeof globalThis.fetch === 'function') {
  fetchFn = globalThis.fetch.bind(globalThis);
} else {
  try { fetchFn = require('node-fetch'); } catch (err) { throw new Error('fetch missing'); }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
    
    const payload = JSON.parse(event.body);
    const signs = Array.isArray(payload.signs) ? payload.signs.join(', ') : 'Keine spezifischen';
    const participants = Number(payload.participants) || 2;
    const vibe = payload.vibe || 'Fließende Balance';
    const budget = payload.budget || 'Goldene Mitte';
    const distance = payload.distance || 'Kontinentale Weite';
    const transport = payload.transport || 'Flug der Falken';

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200, headers, body: JSON.stringify({
          destination: "Barcelona", explanation: "API nicht verbunden.", bestTimeTip: "Jederzeit",
          packliste: ["Rimowa Cabin Aluminiumkoffer", "Noise-Cancelling Kopfhörer", "Hochwertige Sonnenbrille"], cta_text: "Ferien planen",
          affiliate_suggestions: []
        })
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

    const mistralRes = await fetchFn('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
    });

    const mistralData = await mistralRes.json();
    let rawText = mistralData.choices[0].message.content;
    
    let cleaned = rawText.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) cleaned = fenceMatch[1].trim();
    if (!cleaned.startsWith('{')) {
      const firstJson = cleaned.match(/\{[\s\S]*?\}/);
      if (firstJson) cleaned = firstJson[0];
    }

    let parsed = null;
    try { parsed = JSON.parse(cleaned); } catch(e) { 
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler beim Parsen." }) }; 
    }

    const destRaw = parsed.destination || 'Berlin';
    const destEnc = encodeURIComponent(destRaw);
    const destSlug = destRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // GetTransfer sendet nun sicher auf die Startseite, um den 404 Fehler zu vermeiden.
    const klookTarget = encodeURIComponent(`https://www.klook.com/search/result/?query=${destEnc}`);
    const getTransferTarget = encodeURIComponent(`https://gettransfer.com/`);
    const wpTarget = encodeURIComponent(`https://www.welcomepickups.com/${destSlug}/`);

    parsed.affiliate_suggestions = [
      { 
        type: 'activity', 
        label: `Klook Erlebnisse in ${destRaw}`, 
        affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${klookTarget}` 
      },
      { 
        type: 'transfer', 
        label: `GetTransfer Fahrt`, 
        affiliate_url: `https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044&u=${getTransferTarget}` 
      },
      { 
        type: 'pickup', 
        label: `Welcome Pickups`, 
        affiliate_url: `https://tp.media/r?campaign_id=627&marker=698672&p=8919&trs=492044&u=${wpTarget}` 
      }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
