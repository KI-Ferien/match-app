const https = require('https');

// Hilfsfunktion für HTTP Requests
function httpRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`API Fehler ${res.statusCode}: ${body}`));
                } else {
                    try { resolve(JSON.parse(body)); } 
                    catch (e) { resolve(body); }
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.on('timeout', () => { req.destroy(); reject(new Error("Timeout")); });
        if (postData) req.write(postData);
        req.end();
    });
}

exports.handler = async (event) => {
    // CORS Header (damit deine Website zugreifen darf)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Preflight Check
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        // Daten vom Frontend empfangen
        const { participants, vibe, budget, hobbies, origin, email } = JSON.parse(event.body);
        const TIMEOUT_LIMIT = 9000; 

        // --- TEIL 1: LOGIK FÜR ANREDE & BUDGET ---
        
        // Prüfen: Ist es eine Person oder mehrere?
        // participants ist meist ein Array, z.B. [{zodiac: "Widder", age: 25}]
        const isSingle = participants.length === 1;
        
        // Dynamische Anrede für den Prompt
        const anredeInstruktion = isSingle ? "Anrede: 'Du'" : "Anrede: 'Ihr'";
        const deinEuer = isSingle ? "Dein" : "Euer"; // WICHTIG: Steuert den ersten Satz

        let budgetText = "normal";
        if (budget < 30) budgetText = "günstig (Studenten/Backpacker)";
        if (budget > 70) budgetText = "gehoben (Luxus)";

        // --- TEIL 2: DER KI-PROMPT ---
        const prompt = `
        Rolle: Astrologischer Reiseführer.
        Aufgabe: Erstelle eine inspirierende Email für: ${JSON.stringify(participants)}.
        ${anredeInstruktion}
        
        Input-Daten:
        - Vibe: ${vibe}% Action (0=Ruhe/Kultur, 100=Sport/Party).
        - Budget: ${budgetText}.
        - Hobbies/Wünsche: ${hobbies}.
        - Alter = Gefühltes Alter / Energielevel.
        
        STRUKTUR DER ANTWORT (Halte dich genau daran!):
        1. Starte SOFORT mit dem Ziel: "${deinEuer} Seelenort ist: [Stadt, Land]!"
        2. Die Highlights: Nenne 3 konkrete Tipps für vor Ort, die GENAU zu den Hobbies passen. Sei spezifisch!
        3. Die Magie: Erkläre kurz, warum dieses Ziel astrologisch perfekt zur Energie passt.
        
        Regeln:
        - Nutze Wort "Ferien".
        - Keine Markdown-Sternchen (*).
        - Keine Betreffzeile.
        - Länge: ca. 100 Wörter.
        `;

        const mistralKey = process.env.MISTRAL_API_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if(!mistralKey || !resendKey) throw new Error("API Keys fehlen in Netlify.");

        // --- TEIL 3: MISTRAL AI ABFRAGE ---
        const mistralRequest = {
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${mistralKey}`, 'Content-Type': 'application/json' },
            timeout: TIMEOUT_LIMIT 
        };

        const mistralBody = JSON.stringify({
            model: "mistral-tiny", 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
            temperature: 0.6
        });

        let aiText = "";
        
        try {
            const aiResponse = await httpRequest(mistralRequest, mistralBody);
            aiText = aiResponse.choices?.[0]?.message?.content || "";
            // Bereinigung von Markdown und Betreffzeilen
            aiText = aiText.replace(/\*\*/g, "").replace(/Betreff:.*?\n/i, "").trim();
        } catch (e) {
            console.error("KI-Fehler:", e);
            // Fallback Text (auch hier Singular/Plural beachten)
            aiText = isSingle 
                ? `Dein Seelenort ist: Lissabon, Portugal! Genieße Pastéis de Nata und die Sonne.` 
                : `Euer Seelenort ist: Lissabon, Portugal! Genießt Pastéis de Nata und die Sonne.`;
        }
        
        if (!aiText) aiText
