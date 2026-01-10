// netlify/functions/match.js
// Dies ist die Serverless Function, die durch das Formular in index.html ausgelöst wird.

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; // Lädt den Key aus den Netlify Environment Variables

exports.handler = async (event, context) => {
    // 1. Sicherheit: Nur POST-Anfragen vom Formular akzeptieren
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Methode nicht erlaubt (Erwarte POST)." };
    }

    // 2. Sicherheit: API-Key prüfen
    if (!MISTRAL_API_KEY) {
        console.error("FEHLER: MISTRAL_API_KEY fehlt in den Umgebungsvariablen.");
        return { statusCode: 500, body: JSON.stringify({ error: "Interner Fehler: API-Schlüssel fehlt." }) };
    }

    try {
        // Netlify Forms senden die Daten im Body als URL-encoded,
        // aber wenn die Function als Lambda Trigger verwendet wird,
        // kommt der Body oft als JSON-Objekt an (Payload-Struktur).
        
        // Versuche, die Daten zu parsen, egal wie sie kommen
        let data;
        try {
             // Wenn das Formular den Lambda-Trigger verwendet, kommt der Body meist als JSON
             const parsedBody = JSON.parse(event.body);
             // Wir verwenden die Felder im 'data' Teil des Payload
             data = parsedBody.payload.data; 
        } catch (e) {
             // Fallback für den Fall, dass es sich um einen reinen URL-Encoded Body handelt
             console.log("Fehler beim Parsen der Payload, versuche URL-encoded parsing...");
             const qs = require('querystring');
             data = qs.parse(event.body);
        }

        // Destrukturierung der Formularfelder
        const { q_sehnsucht, q_activity, q_social, q_adjektive, email } = data;

        // --- PROMPT DESIGN: Anweisung an die KI ---
        const llmPrompt = `
Sie sind ein psychografischer Reiseanalyst und Ihr Ziel ist es, den perfekten Seelen-Urlaub zu finden.

NUTZERDATEN:
- Sehnsucht (Was zurücklassen): "${q_sehnsucht}"
- Wunsch-Adjektive: "${q_adjektive}"
- Aktivität (1=Ruhe, 5=Action): ${q_activity}
- Sozial (1=Allein, 5=Gemeinschaft): ${q_social}

ANALYSEN-ANWEISUNG:
1. Erstellen Sie einen "Tensions-Score" (0-100), der angibt, wie dringend und tief die benötigte Erholung ist.
2. Identifizieren Sie 3 thematische Keywords (z.B. 'Meer', 'Natur', 'Kultur'), die am besten zur Psyche passen.
3. Empfehlen Sie EINE Reise-Klasse (z.B. 'Wellness-Retreat', 'Digital Detox Abenteuer', 'Städtereise mit Tiefgang').
4. Schreiben Sie eine kurze, überzeugende 4-Zeilen-Beschreibung für den Nutzer, die die Empfehlung verkauft.

Rückgabeformat: Geben Sie das Ergebnis **ausschließlich** als sauberes JSON-Objekt zurück.
JSON-SCHEMA: { "tensions_score": Zahl, "keywords": [String, String, String], "klassen_empfehlung": String, "beschreibung": String }
        `;
        
        // --- API-Aufruf an Mistral ---
        const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
        
        const response = await fetch(MISTRAL_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-large-latest",
                messages: [{ role: "user", content: llmPrompt }],
                response_format: { type: "json_object" }, // Erzwingt JSON-Ausgabe
                temperature: 0.7 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API Fehler: ${response.status} - ${errorText}`);
        }

        const mistralData = await response.json();
        const llmResult = mistralData.choices[0].message.content;

        // Parsen des KI-JSON-Ergebnisses
        const matchingResult = JSON.parse(llmResult);
        
        console.log("Mistral Ergebnis (KI-Response):", matchingResult);
        console.log("E-Mail des Nutzers:", email);
        
        // Im realen Szenario: Hier würden wir die E-Mail senden.
        
        // Erfolgsantwort (200 OK)
        return {
            statusCode: 200, 
            body: JSON.stringify({ 
                message: "Analyse erfolgreich durchgeführt und Ergebnis geloggt.",
                result: matchingResult 
            })
        };

    } catch (error) {
        console.error("Kritischer Funktionsfehler:", error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: `KI-Analyse konnte nicht abgeschlossen werden: ${error.message}` }) 
        };
    }
};
