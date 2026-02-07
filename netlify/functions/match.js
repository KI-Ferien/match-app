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
        
        if (!aiText) aiText = "Die Sterne sortieren sich noch neu. Bitte versuche es gleich noch einmal.";

        // Vorschau für die Webseite
        let previewText = aiText.length > 100 ? aiText.substring(0, 97) + "..." : aiText;

        // --- TEIL 4: LINKS BAUEN ---

        // Zielort aus dem Text extrahieren
        let zielOrt = "Urlaub"; 
        const zielMatch = aiText.match(/ist:\s*(.*?)[!.]/);
        if (zielMatch && zielMatch[1]) {
            zielOrt = zielMatch[1].trim();
        }

        const zielEncoded = encodeURIComponent(zielOrt);
        
        // DEINE ID (Hier kannst du wechseln zwischen 492044 und 698672)
        const tpId = '698672'; 

        // Link 1: Klook (Dynamisch + Deutsch /de/)
        const linkKlook = `https://www.klook.com/de/search?query=${zielEncoded}&aid=${tpId}`;
        
        // Link 2: GetTransfer (Statisch)
        const linkTransfer = "https://gettransfer.tpk.lv/mPE1eDIa";
        
        // Link 3: Generisch (Statisch)
        const linkGeneric = "https://tpk.lv/pXm2idkE";


        // --- TEIL 5: EMAIL VERSAND (RESEND) ---

        const emailRequest = {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            timeout: 3000 
        };

        const emailBody = JSON.stringify({
            from: 'Kosmische Ferien <info@ki-ferien.de>', 
            to: [email],
            subject: `${deinEuer} Seelenort ist: ${zielOrt} ✨`,
            html: `
                <div style="font-family: 'Helvetica', sans-serif; color: #333; padding: 30px; background-color: #fdfbf7; border: 1px solid #eee; max-width: 600px; margin: 0 auto; border-radius: 10px;">
                    <div style="text-align:center; margin-bottom:20px; color:#e67e22; font-size:1.6em; font-weight:bold;">✨ KI-Ferien.de</div>
                    
                    <div style="font-size: 1.1rem; white-space: pre-line; line-height: 1.6; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        ${aiText}
                    </div>
                    
                    <hr style="border:0; border-top:1px solid #e0d4b8; margin:30px 0;">
                    
                    <div style="text-align:center;">
                        <h3 style="color: #2c3e50; margin-bottom: 20px;">Passende Angebote für ${zielOrt}:</h3>

                        <a href="${linkKlook}" style="display: block; margin-bottom: 15px; background-color: #ff5722; color: white; padding: 15px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🎡 Ausflüge in ${zielOrt} entdecken
                        </a>

                        <a href="${linkTransfer}" style="display: block; margin-bottom: 15px; background-color: #27ae60; color: white; padding: 15px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🚕 Transfer zum Hotel buchen
                        </a>

                        <a href="${linkGeneric}" style="display: block; margin-bottom: 15px; background-color: #2980b9; color: white; padding: 15px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            💎 Zum Top-Angebot
                        </a>
                    </div>

                    <hr style="border:0; border-top:1px solid #e0d4b8; margin:30px 0;">
                    
                    <div style="text-align:center; font-style: italic; color: #7f8c8d; font-size: 0.9rem;">
                        Magische Grüße,<br>Michael & das KI-Team
                    </div>
                </div>
            `
        });

        await httpRequest(emailRequest, emailBody);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Gesendet", preview: previewText })
        };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
