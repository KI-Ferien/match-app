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
        const { participants, vibe, budget, hobbies, email } = JSON.parse(event.body);
        const TIMEOUT_LIMIT = 6000; 

        // Singular / Plural Check
        const isSingle = participants.length === 1;
        const anredeInstruktion = isSingle 
            ? "Sprich den Nutzer persönlich an ('Du')." 
            : "Sprich die Gruppe an ('Ihr').";

        // Budget Text
        let budgetText = "ausgewogen";
        if (budget < 30) budgetText = "sehr günstig / Low-Budget";
        if (budget > 70) budgetText = "gehoben / Luxus";

        // Prompt mit Hinweis auf "Gefühltes Alter"
        const prompt = `
        Du bist ein astrologischer Reise-Experte.
        Schreibe direkt den Inhalt einer Email.
        
        Zielgruppe (Alter = GEFÜHLTES Alter!): ${JSON.stringify(participants)}.
        ${anredeInstruktion}
        
        Präferenzen:
        - Vibe: ${vibe}% Action (0=Ruhe, 100=Action).
        - Budget: ${budgetText}.
        - Wünsche: ${hobbies}.
        
        Aufgabe:
        1. Empfiehl EIN konkretes Ferienziel (Stadt, Land). PRÜFE GEOGRAFIE.
        2. Begründe astrologisch und beziehe dich auf das gefühlte Alter (Energielevel).
        3. Nutze Wort "Ferien".
        4. Keine Markdown-Formatierung (**).
        5. Keine Platzhalter.
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
            max_tokens: 250, 
            temperature: 0.4 
        });

        let aiText = "Die Sterne empfehlen Ferien.";
        
        try {
            const aiResponse = await httpRequest(mistralRequest, mistralBody);
            aiText = aiResponse.choices?.[0]?.message?.content || aiText;
            aiText = aiText.replace(/\*\*/g, ""); 
            aiText = aiText.replace(/Betreff:.*?\n/i, "").trim();
        } catch (e) {
            console.error("KI-Fallback:", e);
            aiText = `Liebe Reisende,\n\ntechnische Sternen-Interferenz. Wir empfehlen manuell: Portugal (Algarve). Perfekt für euer Energielevel.`;
        }

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
            subject: 'Deine persönliche Ferien-Empfehlung ✨',
            html: `
                <div style="font-family: 'Georgia', serif; color: #333; padding: 30px; line-height: 1.6; background-color: #fffaf0; border: 1px solid #eee;">
                    <div style="text-align:center; margin-bottom:20px; color:#d35400; font-size:1.5em;">✨ KI-Ferien.de</div>
                    <div style="font-size: 1.1rem; white-space: pre-line;">${aiText}</div>
                    <hr style="border:0; border-top:1px solid #ddd; margin:30px 0;">
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
            body: JSON.stringify({ message: "Gesendet", preview: aiText })
        };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
