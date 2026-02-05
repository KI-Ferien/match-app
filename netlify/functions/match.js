const https = require('https');

// Hilfsfunktion: Stabil & Schnell (mit Timeout-Notbremse)
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
        
        // Timeout-Schutz
        req.on('timeout', () => { 
            req.destroy(); 
            reject(new Error("Timeout")); 
        });
        
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
        const { participants, vibe, hobbies, email } = JSON.parse(event.body);
        const TIMEOUT_LIMIT = 6000; 

        // --- PROMPT (Stilvoll & Familienfreundlich) ---
        const prompt = `
        Du bist ein renommierter astrologischer Reise-Experte. Stil: Elegant, herzlich, familienfreundlich.
        
        Gruppe: ${JSON.stringify(participants)}.
        Präferenzen: Vibe ${vibe}% (0=Ruhe, 100=Action), Wünsche: ${hobbies}.
        
        Aufgabe:
        1. Empfiehl EIN konkretes, sicheres Ferienziel (Stadt, Land). PRÜFE DIE GEOGRAFIE!
        2. Begründe die Wahl charmant mit der Sternzeichen-Konstellation.
        3. Schreibe eine stilvolle Email.
        
        Regeln:
        - Nutze IMMER "Ferien" (nie "Urlaub").
        - Keine Jugendsprache.
        - Maximal 4 Sätze.
        `;

        const mistralKey = process.env.MISTRAL_API_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if(!mistralKey || !resendKey) throw new Error("API Keys fehlen.");

        // --- SCHRITT A: MISTRAL (KI) ---
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
            max_tokens: 200, 
            temperature: 0.4 
        });

        let aiText = "Die Sterne empfehlen harmonische Ferien im sonnigen Süden.";
        
        try {
            const aiResponse = await httpRequest(mistralRequest, mistralBody);
            aiText = aiResponse.choices?.[0]?.message?.content || aiText;
        } catch (e) {
            console.error("KI-Fallback:", e);
            aiText = `Aufgrund der aktuellen Sternen-Konstellation empfehlen wir Ihnen für Ihren Wunsch nach ${vibe > 50 ? 'Erlebnissen' : 'Erholung'} wunderbare Ferien an der Algarve in Portugal. Dort finden Sie die perfekte Balance.`;
        }

        // --- SCHRITT B: EMAIL VERSAND (RESEND) ---
        const emailRequest = {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            timeout: 3000 
        };

        const emailBody = JSON.stringify({
            // WICHTIG: Hier steht jetzt deine verifizierte Domain!
            // Falls du eine andere Adresse als 'info' willst, ändere es hier einfach.
            from: 'Kosmische Ferien <info@ki-ferien.de>', 
            
            to: [email], // Jetzt darf hier JEDE Email stehen
            subject: 'Ihre persönliche Ferien-Empfehlung ✨',
            html: `
                <div style="font-family: 'Georgia', serif; color: #2c3e50; padding: 30px; line-height: 1.6; background-color: #fdfbf7;">
                    <h2 style="color: #d35400; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Die Sterne haben gesprochen</h2>
                    <p style="font-size: 1.1rem;">${aiText.replace(/\n/g, '<br>')}</p>
                    <div style="margin-top: 30px; font-style: italic; color: #7f8c8d; font-size: 0.9rem;">
                        Wir wünschen Ihnen magische Momente.<br>
                        Herzlichst,<br>
                        Ihr Team von KI-Ferien.de
                    </div>
                </div>
            `
        });

        await httpRequest(emailRequest, emailBody);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Gesendet", preview: aiText })
        };

    } catch (error) {
        console.error("Critical Error:", error);
        return {
            statusCode: 500, 
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
