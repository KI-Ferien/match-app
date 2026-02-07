const https = require('https');

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
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { participants, vibe, budget, hobbies, origin, email } = JSON.parse(event.body);
        const TIMEOUT_LIMIT = 9000; 

        // Startort für den Link (nicht für den KI Text)
        const startort = origin || "Deutschland";

        const isSingle = participants.length === 1;
        const anredeInstruktion = isSingle ? "Anrede: 'Du'" : "Anrede: 'Ihr'";

        let budgetText = "normal";
        if (budget < 30) budgetText = "günstig (Studenten/Backpacker)";
        if (budget > 70) budgetText = "gehoben (Luxus)";

        // --- DER NEUE PROMPT: Fokus auf ZIEL & HIGHLIGHTS ---
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
        1. Starte SOFORT mit dem Ziel: "Euer Seelenort ist: [Stadt, Land]!"
        2. Die Highlights: Nenne 3 konkrete Tipps für vor Ort, die GENAU zu den Hobbies passen (z.B. ein spezielles Café, ein Museum, ein Strand, eine Aktivität). Sei spezifisch!
        3. Die Magie: Erkläre kurz, warum dieses Ziel astrologisch perfekt zur Energie der Gruppe passt.
        
        Regeln:
        - Nutze Wort "Ferien".
        - Keine Markdown-Sternchen (*).
        - Keine Betreffzeile.
        - Länge: ca. 100 Wörter.
        `;

        const mistralKey = process.env.MISTRAL_API_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if(!mistralKey || !resendKey) throw new Error("API Keys fehlen.");

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
            max_tokens: 400, // Etwas mehr Platz für die Tipps
            temperature: 0.6 // Etwas kreativer für coole Tipps
        });

        let aiText = "";
        
        try {
            const aiResponse = await httpRequest(mistralRequest, mistralBody);
            aiText = aiResponse.choices?.[0]?.message?.content || "";
            aiText = aiText.replace(/\*\*/g, "").replace(/Betreff:.*?\n/i, "").trim();
        } catch (e) {
            console.error("KI-Fehler:", e);
            aiText = isSingle 
                ? `Euer Seelenort ist: Lissabon, Portugal!\n\nHighlights für dich: Schlendere durch die Alfama, genieße Pastéis de Nata und fahre zum Surfen an die Costa da Caparica. Astrologisch perfekt für deine Abenteuerlust.` 
                : `Euer Seelenort ist: Lissabon, Portugal!\n\nHighlights für euch: Schlendert durch die Alfama, genießt Pastéis de Nata und fahrt zum Surfen an die Costa da Caparica. Astrologisch perfekt für eure Abenteuerlust.`;
        }
        
        if (!aiText) aiText = "Die Sterne sortieren sich noch neu. Bitte versuche es gleich noch einmal.";

        // Wir erstellen einen "Teaser" für die Webseite (Die ersten 120 Zeichen der Antwort)
        // Meistens ist das: "Euer Seelenort ist: Wien, Österreich! Highlights: ..."
        let previewText = aiText.length > 100 ? aiText.substring(0, 97) + "..." : aiText;

        // --- ÄNDERUNG START: Ziel auslesen & Links bauen ---

        // Wir versuchen, das Ziel aus dem KI-Text zu "fischen" (steht meist nach "Seelenort ist:")
        let zielOrt = "Urlaub"; // Fallback, falls die KI komisch antwortet
        const zielMatch = aiText.match(/ist:\s*(.*?)[!.]/);
        if (zielMatch && zielMatch[1]) {
            zielOrt = zielMatch[1].trim();
        }

        const zielEncoded = encodeURIComponent(zielOrt);
        const tpId = '492044'; // Deine ID

        // Link 1: Klook (sucht nach dem KI-Ziel)
        const linkKlook = `https://www.klook.com/search?query=${zielEncoded}&aid=${tpId}`;
        // Link 2: GetTransfer (statisch)
        const linkTransfer = "https://gettransfer.tpk.lv/mPE1eDIa";
        // Link 3: Dein dritter Link (statisch)
        const linkGeneric = "https://tpk.lv/pXm2idkE";

        // --- ÄNDERUNG ENDE ---

        const emailRequest = {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            timeout: 3000 
        };

        // Hier bauen wir die E-Mail OHNE Maps, aber MIT deinen Links
        const emailBody = JSON.stringify({
            from: 'Kosmische Ferien <info@ki-ferien.de>', 
            to: [email],
            subject: `Dein Seelenort ist: ${zielOrt} ✨`,
            html: `
                <div style="font-family: 'Georgia', serif; color: #333; padding: 30px; background-color: #fffaf0; border: 1px solid #eee; max-width: 600px; margin: 0 auto;">
                    <div style="text-align:center; margin-bottom:20px; color:#e67e22; font-size:1.6em; font-weight:bold;">✨ KI-Ferien.de</div>
                    
                    <div style="font-size: 1.15rem; white-space: pre-line; line-height: 1.6;">${aiText}</div>
                    
                    <hr style="border:0; border-top:1px solid #e0d4b8; margin:30px 0;">
                    
                    <div style="text-align:center;">
                        <h3 style="color: #2c3e50; margin-bottom: 20px;">Deine Angebote für ${zielOrt}:</h3>

                        <div style="margin-bottom: 15px;">
                            <a href="${linkKlook}" style="background-color: #ff5722; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                🎡 Aktivitäten in ${zielOrt} entdecken
                            </a>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <a href="${linkTransfer}" style="background-color: #27ae60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                🚕 Transfer zum Hotel buchen
                            </a>
                        </div>

                        <div>
                            <a href="${linkGeneric}" style="background-color: #2980b9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                💎 Zum Top-Angebot
                            </a>
                        </div>
                    </div>

                    <hr style="border:0; border-top:1px solid #e0d4b8; margin:30px 0;">
                    
                    <div style="text-align:center; font-style: italic; color: #7f8c8d; font-size: 0.95rem;">
                        Magische Grüße,<br>Michael & das KI-Team
                    </div>
                </div>
            `
        });

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
            subject: 'Dein kosmischer Reiseplan ist da 🗺️',
            html: `
                <div style="font-family: 'Georgia', serif; color: #333; padding: 30px; background-color: #fffaf0; border: 1px solid #eee; max-width: 600px; margin: 0 auto;">
                    <div style="text-align:center; margin-bottom:20px; color:#e67e22; font-size:1.6em; font-weight:bold;">✨ KI-Ferien.de</div>
                    
                    <div style="font-size: 1.15rem; white-space: pre-line; line-height: 1.6;">${aiText}</div>
                    
                    <div style="text-align:center; margin-top: 35px; margin-bottom: 15px;">
                        <a href="${mapsLink}" style="background-color: #27ae60; color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-family: sans-serif; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                           🚗 Route von ${startort} berechnen
                        </a>
                    </div>
                    <div style="text-align:center; font-size: 0.8rem; color: #999;">(Klicke auf den Button und gib das Ziel aus der Email ein)</div>

                    <hr style="border:0; border-top:1px solid #e0d4b8; margin:30px 0;">
                    
                    <div style="text-align:center; font-style: italic; color: #7f8c8d; font-size: 0.95rem;">
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
