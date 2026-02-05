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
        
        // Timeout-Schutz: Bricht ab, bevor Netlify den Stecker zieht
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
        
        // Timeout Limit (6 Sek für die KI, Rest für Email)
        const TIMEOUT_LIMIT = 6000; 

        // --- DER STILVOLLE & FAMILIENFREUNDLICHE PROMPT ---
        const prompt = `
        Du bist ein renommierter astrologischer Reise-Experte. Dein Stil ist elegant, herzlich und familienfreundlich.
        
        Die Reisegruppe: ${JSON.stringify(participants)}.
        Präferenzen: Vibe ${vibe}% (0=Ruhe, 100=Action), Wünsche: ${hobbies}.
        
        Deine Aufgabe:
        1. Empfiehl EIN konkretes, sicheres Ferienziel (Stadt, Land). Achte penibel auf korrekte Geografie!
        2. Begründe die Wahl charmant mit der Konstellation der Sternzeichen.
        3. Schreibe den Text als stilvolle Email an die Familie/Gruppe.
        
        Wichtige Regeln:
        - Nutze IMMER das Wort "Ferien" (niemals "Urlaub").
        - Vermeide Jugendsprache. Sei inspirierend und warmherzig.
        - Fasse dich kurz (maximal 4 Sätze).
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
            max_tokens: 200, // Genug Platz für stilvolle Sätze
            temperature: 0.4 // Balance zwischen Kreativität und Faktentreue
        });

        let aiText = "Die Sterne empfehlen harmonische Ferien im sonnigen Süden.";
        
        try {
            const aiResponse = await httpRequest(mistralRequest, mistralBody);
            aiText = aiResponse.choices?.[0]?.message?.content || aiText;
        } catch (e) {
            console.error("KI-Fallback aktiv:", e);
            // Fallback-Text im gleichen stilvollen Tonfall
            aiText = `Auch wenn der Blick in die Sterne kurz verschleiert war: Für Ihre Konstellation und den Wunsch nach ${vibe > 50 ? 'Erlebnissen' : 'Erholung'} empfehlen wir wunderbare Ferien an der Algarve in Portugal. Dort finden Sie die perfekte Balance für alle Generationen.`;
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
            from: 'Kosmische Ferien <onboarding@resend.dev>',
            to: [email],
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
            body: JSON.stringify({ error: error.message || "Ein unerwarteter Fehler ist aufgetreten." })
        };
    }
};
