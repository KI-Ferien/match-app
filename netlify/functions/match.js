const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Nur POST-Requests zulassen
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { sign, age, vibe, budget } = data;

        // Mistral API Key aus den Umgebungsvariablen
        const mistralKey = process.env.MISTRAL_API_KEY;

        if (!mistralKey) {
            console.error("MISTRAL_API_KEY fehlt.");
            return {
                statusCode: 200,
                body: JSON.stringify({ destination: "Santorini, Griechenland" })
            };
        }

        // Prompt für Mistral (komplett auf Ferien getrimmt)
        const promptText = `
        Du bist ein Reiseberater. Ein Kunde macht /astro Ferien-Planung.
        Daten:
        Sternzeichen: ${sign}
        Gefühltes Alter: ${age}
        Ferientyp: ${vibe}
        Budget: ${budget}
        
        Nenne als Antwort AUSSCHLIESSLICH den Namen des perfekten Ferienortes und das Land (z.B. "Kyoto, Japan" oder "Marrakesch, Marokko"). Keine Erklärungen, nur den Ort!
        `;

        // Abfrage an Mistral
        const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralKey}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{ role: 'user', content: promptText }],
                max_tokens: 15
            })
        });

        const mistralData = await mistralRes.json();
        let destination = "Porto, Portugal"; // Fallback

        if (mistralData.choices && mistralData.choices[0]) {
            destination = mistralData.choices[0].message.content.trim();
            // Bereinigen von Sonderzeichen
            destination = destination.replace(/["\.]/g, '');
        }

        // Antwort ans Frontend
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination })
        };

    } catch (error) {
        console.error("Fehler im Backend:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ destination: "Bali, Indonesien" })
        };
    }
};