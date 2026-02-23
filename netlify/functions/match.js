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
    
    STRENGE GEOGRAFISCHE BEFEHLE:
    1. "Heimatliche Gefilde" & "Nachbarreiche": Ziel MUSS in Deutschland, Österreich, Frankreich, Italien, Belgien, Niederlande oder Schweiz liegen.
    2. "Kontinentale Weite": Ziel DARF NUR in ganz Europa liegen.
    3. NUR bei "Über die Meere" + Transport "Flug der Falken" sind Fernziele erlaubt.
    
    WICHTIGE TRANSFER-LOGIK:
    - Damit Transfer-Dienste funktionieren, darf die "destination" KEINE Region sein. 
    - Nenne IMMER eine konkrete, bekannte Stadt oder einen Flughafen-Hub (z.B. "Innsbruck" statt "Tirol", "Salzburg" statt "Salzkammergut", "Bozen" statt "Südtirol").
    
    INHALTLICHE VORGABEN:
    - Nutze das Wort "Ferien".
    - Binde Buddha (Yamamoto 1973) und Atman (Webster 2003) tiefgründig ein, ohne sie namentlich zu nennen.
    - Die Packliste soll 3-4 nützliche reale Profi-Items enthalten.
    
    Antworte NUR mit validem JSON:
    {
      "destination": "Name der Stadt (z.B. Wien, Berlin, Paris, Innsbruck)",
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
        temperature: 0.1 
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    const start = content.indexOf('{'), end = content.lastIndexOf('}');
    const result = JSON.parse(content.substring(start, end + 1));

    const dRaw = result.destination;
    const dEnc = encodeURIComponent(dRaw);
    
    // Welcome Pickups braucht nur den Stadtnamen ohne Land
    let cityOnly = dRaw.split(',')[0].split('(')[0].trim();
    const dSlug = cityOnly.toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
        label: "Persönlicher Empfang (Welcome Pickups)", 
        affiliate_url: `https://tp.media/r?campaign_id=627&marker=698672&p=8919&trs=492044&u=${encodeURIComponent('https://www.welcomepickups.com/' + dSlug + '/')}` 
      }
    ];

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Kosmische Störung", details: error.message }) };
  }
};
