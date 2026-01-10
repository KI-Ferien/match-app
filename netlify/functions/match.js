// netlify/functions/match.js
// Dies ist das Serverless-Skript, das von Netlify Forms ausgeführt wird.

// WICHTIG: Stellt sicher, dass der Mistral-Key aus den Umgebungsvariablen geladen wird.
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; 

// Haupt-Handler-Funktion
exports.handler = async (event, context) => {
    // 1. Sicherheit: Nur POST-Anfragen von Netlify Forms akzeptieren
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Methode nicht erlaubt" };
    }

    try {
        // Die Formulardaten werden als JSON in event.body geliefert.
        const data = JSON.parse(event.body).payload.data;

        // Extrahieren der Inputs (aus index.html)
        const { q_sehnsucht, q_activity, q_social, q_adjektive, email } = data;

        // --- 2. PROMPT DESIGN (Die Anweisung an die KI) ---
        const llmPrompt = `
Sie sind ein psychografischer Reiseanalyst. Analysieren Sie die Nutzerdaten und geben Sie das Ergebnis als sauberes JSON zurück.

NUTZERDATEN:
- Sehnsucht (Was zurücklassen): "${q_sehnsucht}"
- Wunsch-Adjektive: "${q_adjektive}"
- Aktivität (1-5): ${q_activity}
- Sozial (1-5): ${q_social}

ANALYSEN-ANWEISUNG:
1. Erstellen Sie einen "Tensions-Score" (0-100), der den Grad der benötigten Erholung angibt.
2. Identifizieren Sie 3 thematische Keywords (z.B. 'Meer', 'Natur').
3. Empfehlen Sie EINE Reise-Klasse (z.B. 'Wellness-Retreat', 'Aktivurlaub').

JSON-SCHEMA: { "tensions_score": Zahl, "keywords": [String, String, String], "klassen_empfehlung": String }
        `;
        
        // --- 3. Platzhalter für API-Aufruf ---
        // Hier kommt später der Axios- oder Fetch-Code, um Mistral mit dem llmPrompt aufzurufen.
        
        console.log("LLM Prompt bereit:", llmPrompt);

        // Standard-Erfolgsantwort: Netlify wird den Nutzer trotzdem zu /success umleiten
        return {
            statusCode: 200, 
            body: JSON.stringify({ message: "Analyse gestartet. Warten auf Mistral API-Antwort." })
        };

    } catch (error) {
        console.error("Fehler in der Function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Interner Server-Fehler." }) };
    }
};
