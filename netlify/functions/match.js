/**
 * netlify/functions/match.js
 * Backend-Logik für KI-Ferien.de
 * Verbindet Sternzeichen-Daten mit der Mistral-KI
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Nur POST-Anfragen erlauben
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    try {
        const { participants } = JSON.parse(event.body);

        if (!participants || !Array.isArray(participants)) {
            throw new Error("Ungültige Teilnehmerdaten.");
        }

        // Mistral API Key aus den Netlify Umgebungsvariablen
        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

        if (!MISTRAL_API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "API-Key fehlt in der Konfiguration." }),
            };
        }

        // Erstellung des Prompts für die Kosmische Ferien-Analyse
        const participantString = participants
            .map((p, i) => `Person ${i + 1}: Sternzeichen ${p.zodiac}, gefühltes Alter ${p.age}`)
            .join("; ");

        const prompt = `Du bist ein Experte für Astrologie und Reiseplanung. 
        Analysiere folgende Reisegruppe für ihre Ferien: ${participantString}.
        Erstelle basierend auf den Sternzeichen-Energien und dem Alter eine harmonische, 
        begeisternde Empfehlung für ein Urlaubsziel. Erkläre kurz, warum dieses Ziel 
        astrologisch perfekt zu dieser speziellen Konstellation passt. 
        Halte die Antwort kompakt und motivierend. Nutze das Wort 'Ferien' statt 'Urlaub'.`;

        // Aufruf der Mistral API
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
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

        const data = await response.json();
        const recommendation = data.choices[0].message.content;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recommendation: recommendation
            }),
        };

    } catch (error) {
        console.error("Fehler in der Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Fehler bei der kosmischen Analyse: " + error.message }),
        };
    }
};
