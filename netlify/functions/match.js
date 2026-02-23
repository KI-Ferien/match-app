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

    const prompt = `Du bist ein unfehlbares astrologisches Orakel für Ferien. /astro
    Parameter: Personen: ${payload.participants}, Zeichen: ${payload.signs}, Distanz: ${payload.distance}.
    
    WICHTIG: 
    - Wenn Distanz "Heimatliche Gefilde" oder "Nachbarreiche", nenne NUR Ziele in DACH, BeNeLux oder Frankreich.
    - Variiere Deine Ziele! Schlage nicht immer das Gleiche vor.
    - Nutze das Wort "Ferien". Binde die Konzepte von Stille und Einheit (Buddha/Atman) diskret ein.
    - Nenne als "destination" eine Stadt für den Transfer-Link.

    Antworte NUR mit validem JSON:
    {
      "destination": "Stadtname",
      "explanation": "Atmosphärische Begründung...",
      "bestTimeTip": "Tipp",
      "packliste": ["Item 1", "Item 2", "Item 3"],
      "cta_text": "Ferien buchen"
    }`;

    const response = await fetchFn('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7 // Höherer Wert verhindert die ständigen Wiederholungen
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const start = content.indexOf('{'), end = content.lastIndexOf('}');
    const result = JSON.parse(content.substring(start, end + 1));

    const dRaw = result.destination;
    const dSlug = dRaw.toLowerCase().trim().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-');

    result.affiliate_suggestions = [
      { label: `${dRaw} Erlebnisse`, affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${encodeURIComponent('https://www.klook.com/de/search/result/?query=' + encodeURIComponent(dRaw))}` },
      { label: "Transfer (GetTransfer)", affiliate_url: `https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044&u=${encodeURIComponent('https://gettransfer.com/de')}` },
      { label: "Welcome Pickups", affiliate_url: `https://tp.media/r?campaign_id=627&marker=698672&p=8919&trs=492044&u=${encodeURIComponent('https://www.welcomepickups.com/' + dSlug + '/')}` }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Kosmische Störung" }) };
  }
};
