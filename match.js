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
        if (!apiKey) return resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "API-Key fehlt" }) });

        const payload = JSON.parse(event.body || '{}');
        const prompt = `Analysiere für ${payload.participants || 2} Personen (${payload.signs || 'Reisende'}): Ziel, Begründung mit Buddha (Yamamoto 1973) und Atman (Webster 2003). Nutze das Wort Ferien. Antworte NUR als JSON: {"destination":"...","explanation":"...","bestTimeTip":"...","packliste":["...","...","..."]}`;

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
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (d) => data += d);
            res.on('end', () => {
                try {
                    const mistralData = JSON.parse(data);
                    let content = mistralData.choices[0].message.content.trim();
                    const start = content.indexOf('{'), end = content.lastIndexOf('}');
                    if (start === -1) throw new Error("Kein JSON gefunden");
                    content = content.substring(start, end + 1);
                    const finalObj = JSON.parse(content);
                    
                    finalObj.affiliate_suggestions = [
                        { label: "Erlebnisse", affiliate_url: `https://tp.media/r?campaign_id=137&marker=698672&trs=492044&u=${encodeURIComponent('https://www.klook.com/search/result/?query=' + encodeURIComponent(finalObj.destination))}` }
                    ];
                    resolve({ statusCode: 200, headers, body: JSON.stringify(finalObj) });
                } catch (e) {
                    resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Parsing Fehler", raw: data }) });
                }
            });
        });
        req.on('error', (e) => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
        req.write(postData);
        req.end();
    });
};
