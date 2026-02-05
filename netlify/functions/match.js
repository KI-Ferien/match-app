/**
 * netlify/functions/match.js
 * Backend-Logik für KI-Ferien.de
 * VERSION: 5.0 - Vollständige Mistral-Integration
 */

const fetch = require('node-fetch');

exports.handler = async (event) => {
    // CORS-Header für die Kommunikation mit dem Frontend
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Preflight-Anfrage (OPTIONS) abfangen
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: "Nur POST-Anfragen erlaubt." }) 
        };
    }

    try {
        const { participants } = JSON.parse(event.body);

        if (!participants || !Array.isArray(participants)) {
            throw new Error("Keine Teilnehmerdaten empfangen.");
        }

        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
        if (!MISTRAL_API_KEY) {
            throw new Error("Mistral API Key fehlt in den Netlify Environment Variables.");
        }

        // Erstellung des astrologischen Prompts
        const groupInfo = participants
            .map((p, i) => `Person ${i + 1}: Sternzeichen ${p.zodiac}, gefühltes Alter ${p.age}`)
            .join("; ");

        const prompt = `Du bist ein KI-Astrologe für die Website KI-Ferien.de. 
        Analysiere die folgende Reisegruppe: ${groupInfo}.
        Basierend auf den Sternzeichen-Konstellationen und dem Alter, schlage ein harmonisches Ziel für ihre nächsten Ferien vor. 
        Erkläre die Wahl kurz mit einem Hauch von Astrologie und KI-Logik. 
        Wichtig: Benutze das Wort 'Ferien' statt 'Urlaub'. Antworte kurz und begeisternd auf Deutsch.`;

        // Aufruf der Mistral API
        const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await mistralResponse.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error("Ungültige Antwort von der Mistral API.");
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                recommendation: data.choices[0].message.content
            })
        };

    } catch (error) {
        console.error("Fehler in der Function:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
