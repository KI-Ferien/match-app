const https = require('https');

// Hilfsfunktion: Führt einen HTTPS Request aus (ersetzt fetch/axios für Stabilität)
function httpRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body); // Falls kein JSON zurückkommt
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
        const data = JSON.parse(event.body);
        const { participants, vibe, hobbies, email } = data;

        const mistralKey = process.env.MISTRAL_API_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if (!mistralKey || !resendKey) throw new Error("API Keys fehlen (Mistral oder Resend).");

        // --- SCHRITT 1: MISTRAL FRAGEN ---
        const prompt = `
        Rolle: Du bist ein astrologischer Reiseexperte, der Sicherheit sehr ernst nimmt (Auswärtiges Amt Standards).
        
        Input Daten:
        - Teilnehmer: ${JSON.stringify(participants)}
        - Stimmung (0=Relax, 100=Action): ${vibe}
        - Hobbies/Wünsche: ${hobbies}
        
        Aufgabe:
        1. Analysiere die Sternzeichen-Konstellation.
        2. Wähle ein konkretes Ferien-Ziel (Sicherheitslage beachten!).
        3. Schreibe eine persönliche Email an die Gruppe.
        
        Regeln:
        - Nutze NUR das Wort "Ferien" (nie "Urlaub").
        - Sei charmant, mystisch aber sicherheitsbewusst.
        - Format: Betreffzeile, dann der Text.
        - Länge: Max 200 Wörter.
        `;

        const mistralResponse = await httpRequest({
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${mistralKey}`, 'Content-Type': 'application/json' }
        }, JSON.stringify({
            model: "mistral-tiny",
            messages: [{ role: "user", content: prompt }]
        }));

        const aiText = mistralResponse.choices?.[0]?.message?.content || "Keine Analyse möglich.";

        // --- SCHRITT 2: EMAIL SENDEN (RESEND) ---
        // Hinweis: 'from' muss eine verifizierte Domain bei Resend sein oder 'onboarding@resend.dev' zum Testen
        const emailResponse = await httpRequest({
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' }
        }, JSON.stringify({
            from: 'Kosmische Ferien <onboarding@resend.dev>', 
            to: [email],
            subject: 'Dein kosmisches Ferien-Ziel ist da! ✨',
            html: `<div style="font-family: sans-serif; padding: 20px; background: #f9f9f9;">
                    <h2 style="color: #ff6b6b;">Eure Sterne haben gesprochen</h2>
                    <p style="white-space: pre-wrap;">${aiText}</p>
                    <hr>
                    <small>Erstellt von KI-Ferien.de</small>
                   </div>`
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Email versendet!", preview: aiText })
        };

    } catch (error) {
        console.error("Fehler:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
