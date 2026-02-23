// netlify/functions/match.js
'use strict';

const fetchFn = globalThis.fetch;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) throw new Error("MISTRAL_API_KEY fehlt");

    const prompt = `Du bist ein astrologisches Orakel für Ferien. /astro
    Analysiere für ${payload.participants || 2} Personen der Sternzeichen ${payload.signs || 'Unbekannt'}:
    Vibe: ${payload.vibe}, Budget: ${payload.budget}, Zielweite: ${payload.distance}, Transport: ${payload.transport}.
    
    REGELN:
    1. Nutze das Wort "Ferien".
    2. Binde Buddha (Yamamoto 1973) und Atman (Webster 2003) tiefgründig ein.
    3. Die Packliste muss 3 reale Profi-Reise-Items enthalten (keine Kameras).
    
    Antworte NUR mit validem JSON:
    {
      "destination": "Name des Ziels",
      "explanation": "Begründung...",
      "bestTimeTip": "Reisezeit-Tipp",
      "packliste": ["Item 1", "Item 2", "Item 3"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    const response = await fetchFn('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    const start = content.indexOf('{'), end = content.lastIndexOf('}');
    if (start === -1) throw new Error("Kein JSON gefunden");
    const result = JSON.parse(content.substring(start, end + 1));

    const dEnc = encodeURIComponent(result.destination);
    const dSlug = result.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    result.affiliate_suggestions = [
      { 
        label: `Erlebnisse in ${result.destination} prüfen`, 
        affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${encodeURIComponent('https://www.klook.com/search/result/?query=' + dEnc)}` 
      },
      { 
        label: "Bequemen Transfer buchen", 
        affiliate_url: `https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044&u=${encodeURIComponent('https://gettransfer.com/de')}` 
      },
      { 
        label: "Persönlichen Guide finden", 
        affiliate_url: `https://tp.media/r?campaign_id=627&marker=698672&p=8919&trs=492044&u=${encodeURIComponent('https://www.welcomepickups.com/' + dSlug + '/')}` 
      }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Kosmische Störung", details: error.message }) };
  }
};
