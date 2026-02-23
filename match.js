const https = require('https');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    return new Promise((resolve) => {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            return resolve({ 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ error: "API-Key fehlt in Netlify Umgebungsvariablen" }) 
            });
        }

        let payload;
        try {
            payload = JSON.parse(event.body || '{}');
        } catch (e) {
            return resolve({ statusCode: 400, headers, body: JSON.stringify({ error: "Ungültiger JSON-Body" }) });
        }

        const prompt = `Du bist ein astrologisches Reise-Orakel und erfahrener Reiseexperte. /astro
Analysiere für ${payload.participants || 2} Personen (Sternzeichen: ${payload.signs || 'Unbekannt'}).
Wunsch: ${payload.vibe}, Budget: ${payload.budget}, Entfernung: ${payload.distance}.
WICHTIG: Nutze das Wort "Ferien". Binde Buddha (Yamamoto 1973) und das Atman-Konzept (Webster 2003) tiefgründig ein.
Antworte NUR mit einem validen JSON-Objekt:
{
  "destination": "Stadt oder Insel",
  "explanation": "Begründung...",
  "bestTimeTip": "Reisezeit...",
  "packliste": ["Item 1", "Item 2", "Item 3"],
  "cta_text": "Ferien buchen"
}`;

        const postData = JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        });

        const options = {
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000 
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try {
                    const mistralData = JSON.parse(responseBody);
                    if (!mistralData.choices) throw new Error("Keine Antwort von Mistral erhalten");
                    
                    let contentText = mistralData.choices[0].message.content.trim();
                    
                    // JSON-RETTUNG: Extrahiert alles zwischen den ersten und letzten geschweiften Klammern
                    const start = contentText.indexOf('{');
                    const end = contentText.lastIndexOf('}');
                    if (start === -1 || end === -1) throw new Error("KI hat kein JSON geliefert");
                    const cleanedJson = contentText.substring(start, end + 1);
                    
                    const finalResult = JSON.parse(cleanedJson);

                    // Affiliate Links einfügen
                    const dEnc = encodeURIComponent(finalResult.destination);
                    finalResult.affiliate_suggestions = [
                        { label: `Erlebnisse in ${finalResult.destination}`, affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&p=4110&trs=492044&u=${encodeURIComponent('https://www.klook.com/search/result/?query=' + dEnc)}` },
                        { label: "Transfer buchen", affiliate_url: "https://tp.media/r?campaign_id=147&marker=698672&p=4439&trs=492044" }
                    ];

                    resolve({ statusCode: 200, headers, body: JSON.stringify(finalResult) });
                } catch (err) {
                    resolve({ 
                        statusCode: 500, 
                        headers, 
                        body: JSON.stringify({ error: "JSON-Parsing Fehler", details: err.message, raw: responseBody }) 
                    });
                }
            });
        });

        req.on('error', (e) => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
        req.write(postData);
        req.end();
    });
};
