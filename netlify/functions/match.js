// netlify/functions/match.js

// Importiert das qs-Paket, um Formular-Daten zu parsen, die von Netlify übergeben werden.
const qs = require('querystring'); 

// Die Mistral API-Schlüssel-Variable wird aus den Netlify Environment Variables geladen.
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; 

// Definition des Haupt-Handlers, den Netlify aufruft.
exports.handler = async (event) => {
    // 1. Sicherheit und Methode prüfen
    if (event.httpMethod !== "POST") {
        console.log("Fehler: Nur POST-Anfragen sind erlaubt.");
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 2. Daten parsen
    const body = event.body;
    let data;

    try {
        // Daten von Netlify Forms sind oft URL-Encoded (x-www-form-urlencoded)
        data = qs.parse(body);
        
        // Wir holen die notwendigen Felder aus den Formular-Daten
        const beruf = data.beruf || 'nicht angegeben';
        const faehigkeiten = data.faehigkeiten || 'keine';
        const projektziele = data.projektziele || 'nicht angegeben';
        
        // Den Prompt für die KI erstellen
        const prompt = `Du bist ein erfahrener Karriereberater. Bewerte basierend auf der folgenden Rolle und den Anforderungen, wie gut die Fähigkeiten der Bewerberin/des Bewerbers zum Projekt passen. Gib eine kurze, klare Empfehlung in maximal 50 Wörtern.
        
        Projektrolle/Ziel: ${projektziele}
        Berufserfahrung: ${beruf}
        Fähigkeiten: ${faehigkeiten}
        
        Empfehlung:`;

        // 3. Aufruf der Mistral API
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: "mistral-tiny", // Ein schnelles, kostengünstiges Modell
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1, // Niedrige Temperatur für fokussierte Antworten
            }),
        });

        // 4. API-Antwort verarbeiten
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Mistral API Fehler: Status ${response.status} - ${errorText}`);
            // Loggt den Fehler, leitet aber weiter, um den Nutzer nicht mit einer Fehlerseite zu konfrontieren
            return {
                statusCode: 302,
                headers: { "Location": "/success" }, 
                body: "Redirecting after API Error..."
            };
        }

        const jsonResponse = await response.json();
        const kiEmpfehlung = jsonResponse.choices[0].message.content.trim();

        // 5. Ergebnisse loggen (für Ihr Debugging)
        console.log("--- MISTRAL ERGEBNIS (KI-Response): ---");
        console.log(`Beruf: ${beruf}`);
        console.log(`Ziele: ${projektziele}`);
        console.log(`KI-Empfehlung: ${kiEmpfehlung}`);
        console.log("------------------------------------------");

        // HIER würde der Code zum E-Mail-Versand eingefügt werden.

    } catch (error) {
        console.error("Unerwarteter Fehler im Function Handler:", error);
        // Leitet bei jedem internen Fehler weiter, anstatt eine 500er-Seite zu zeigen
        return {
            statusCode: 302,
            headers: { "Location": "/success" }, 
            body: "Redirecting after Internal Error..."
        };
    }

    // 6. Erfolgreiche Weiterleitung des Nutzers
    // Wichtig: Rückgabe eines 302 Redirects, um den Browser zur Success-Seite zu schicken.
    return {
        statusCode: 302,
        headers: {
            "Location": "/success", // Ziel-URL nach erfolgreicher Verarbeitung
        },
        body: "Success! Redirecting to /success"
    };
};
