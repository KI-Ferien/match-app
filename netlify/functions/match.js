// netlify/functions/match.js
'use strict';

// Nutzt das native fetch von Node.js 20
const fetchFn = globalThis.fetch;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) throw new Error("MISTRAL_API_KEY fehlt");

    const prompt = `Du bist ein astrologisches Orakel und Reiseexperte für Ferien. /astro
    Analysiere für ${payload.participants || 2} Personen der Sternzeichen ${payload.signs || 'Unbekannt'}:
    Vibe: ${payload.vibe}, Budget: ${payload.budget}, Ziel: ${payload.distance}, Transport: ${payload.transport}.
    
    WICHTIGE REGELN:
    1. Nutze das Wort "Ferien".
    2. Einbindung: Buddha (Mahayana, Mahaparinirvana Sutra, Yamamoto 1973) und das Konzept des Atman (Merriam-Webster 2003).
    3. Die Packliste soll persönliche reale Profi-Reise-Items enthalten und sinnvolle Tips.
    
    Antworte NUR mit einem validen JSON-Objekt:
    {
      "destination": "Name des Ziels",
      "explanation": "Tiefgründige Begründung...",
      "bestTimeTip": "Reisezeit-Tipp",
      "packliste": ["Item 1", "Item 2", "Item 3"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    const response = await fetchFn('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Falls die KI Text um das JSON herum baut, filtern wir es hier
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1) throw new Error("Kein JSON gefunden");
    content = content.substring(start, end + 1);

    const result = JSON.parse(content);

    // Affiliate-Links mit deinen IDs (698672 & 492044)
    const dEnc = encodeURIComponent(result.destination);
    result.affiliate_suggestions = [
      { 
        label: `Aktivitäten in ${result.destination}`, 
        affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${encodeURIComponent('https://www.klook.com/search/result/?query=' + dEnc)}` 
      },
      { 
        label: "Transfer finden", 
        affiliate_url: "https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044" 
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Orakel-Fehler:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Kosmische Störung", details: error.message })
    };
  }
};
