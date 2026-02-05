/**
 * Backend-Funktion: match.js
 * Pfad: netlify/functions/match.js
 */

const https = require('https');

exports.handler = async (event) => {
    // CORS-Header für die Kommunikation mit dem Frontend
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { participants } = JSON.parse(event.body);
        const apiKey = process.env.MISTRAL_API_KEY;

        if (!apiKey) {
            throw new Error("MISTRAL_API_KEY ist nicht in Netlify konfiguriert.");
        }

        // Prompt-Erstellung (Ferien statt Urlaub)
        const userPrompt = `Erstelle eine kurze, inspirierende Empfehlung für ein Ferien-Ziel basierend auf diesen Teilnehmern: ${JSON.stringify(participants)}. Antworte in 3-4 Sätzen auf Deutsch. Verwende das Wort 'Ferien'.`;

        const postData = JSON.stringify({
            model: "mistral-tiny",
            messages: [{ role: "user", content: userPrompt }]
        });

        // Wir nutzen das eingebaute 'https' Modul, um 502-Fehler durch fehlende Pakete zu vermeiden
        const request = () => new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.mistral.ai',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });

            req.on('error', (e) => reject(e));
            req.write(postData);
            req.end();
        });

        const result = await request();
        const recommendation = result.choices[0].message.content;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ recommendation })
        };

    } catch (error) {
        console.error("Backend Fehler:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Fehler: " + error.message })
        };
    }
};
