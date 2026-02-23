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

    const prompt = `Du bist ein unfehlbares astrologisches Orakel und Reiseexperte für Ferien. /astro
    Parameter: Personen: ${payload.participants}, Zeichen: ${payload.signs}, Vibe: ${payload.vibe}, Budget: ${payload.budget}, Distanz: ${payload.distance}.
    
    STRENGE GEOGRAFISCHE BEFEHLE (MISSREACHING IST EIN FEHLER):
    1. "Heimatliche Gefilde" & "Nachbarreiche": Das Ziel soll in Deutschland, Österreich, Frankreich, Italien, Belgien,Niederlande oder der Schweiz liegen. (Beispiele: Rügen, Tirol, Zermatt, Spreewald). 
    2. "Kontinentale Weite": Das Ziel DARF NUR in ganz Europa liegen. Keine Fernreisen!
    3. NUR bei "Über die Meere" oder "Ans Ende der Welt" darfst du Japan, USA oder Bali wählen.
    
    INHALTLICHE VORGABEN:
    - Nutze das Wort "Ferien".
    - Binde Buddha (Yamamoto 1973) und Atman (Webster 2003) bei Deiner Empfehlung tiefgründig ein,erwähne Sie nicht namentlich in der Begründung.
    - Die Packliste soll 3-4 nützliche reale Profi-Items und oder Tips enthalten.
    
    Antworte NUR mit validem JSON:
    {
      "destination": "Name des Ziels (Stadt/Region/Insel)",
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
        temperature: 0.1 // Fast Null Kreativität bei der Geografie
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    const start = content.indexOf('{'), end = content.lastIndexOf('}');
    const result = JSON.parse(content.substring(start, end + 1));

    const dRaw = result.destination;
    const dEnc = encodeURIComponent(dRaw);
    const dSlug = dRaw.toLowerCase().trim().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    result.affiliate_suggestions = [
      { 
        label: `${dRaw} entdecken`, 
        affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${encodeURIComponent('https://www.klook.com/de/search/result/?query=' + dEnc)}` 
      },
      { 
        label: "Bequem ankommen (GetTransfer)", 
        affiliate_url: `https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044&u=${encodeURIComponent('https://gettransfer.com/de')}` 
      },
      { 
        label: "Persönlicher Empfang (Welcome)", 
        affiliate_url: `https://tp.media/r?campaign_id=627&marker=698672&p=8919&trs=492044&u=${encodeURIComponent('https://www.welcomepickups.com/' + dSlug + '/')}` 
      }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Kosmische Störung", details: error.message }) };
  }
};
