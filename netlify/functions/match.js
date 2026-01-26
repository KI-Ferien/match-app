const { Resend } = require('resend');

exports.handler = async (event) => {
    // 1. Grundeinstellungen & Sicherheit
    if (event.httpMethod !== "POST") {
        return { statusCode: 302, headers: { 'Location': '/' } };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    const tuiAwinLink = "https://www.awin1.com/awclick.php?mid=12531&id=2734466";

    try {
        // 2. Daten aus dem Formular extrahieren
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Reisender";
        const zodiac = params.get('q_zodiac') || "Entdecker";
        const alter = params.get('q_age') || "junggeblieben";
        const slider = params.get('q_adventure') || "ausgeglichen";
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };
        }

        // 3. KI-Anfrage an Mistral AI
        const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [{
                    role: "user", 
                    content: `Du bist ein Reiseexperte. Erstelle ein Ferien-Match für ${vorname}. 
                    Details: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Präferenz ${slider}, Interessen: ${hobbys}. 
                    Begründe die Wahl des Ziels basierend auf ALL diesen Details.
                    Format:
                    ZIEL: [Name des Ortes]
                    ANALYSE: [3-4 Sätze Begründung]`
                }],
                max_tokens: 250
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Ein perfekt auf dich abgestimmtes Ziel.";

        // 4. E-Mail Versand via Resend (mit Idempotency-Key)
        try {
            const today = new Date().toISOString().split('T')[0];
            const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

            await resend.emails.send({
                from: 'KI-FERIEN <info@ki-ferien.de>',
                to: email,
                bcc: 'mikostro@web.de', 
                subject: `Dein Ferien-Match: ${zielName} 🌴`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 24px; overflow: hidden;">
                        <div style="background: #eff6ff; padding: 40px; text-align: center;">
                            <h1 style="color: #1e293b; margin:0;">Hallo ${vorname}!</h1>
                            <p style="color: #2563eb; font-weight: bold; margin-top: 10px;">Deine persönliche Analyse ist fertig.</p>
                        </div>
                        <div style="padding: 40px; text-align: center;">
                            <h2 style="color: #1e293b; font-size: 28px; margin-bottom: 20px;">${zielName}</h2>
                            <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 4px solid #2563eb; color: #1e3a8a; line-height: 1.6; text-align: left;">
                                ${analyseText}
                            </div>
                            <div style="margin-top: 35px;">
                                <a href="${tuiAwinLink}" target="_blank" style="background: #d40e14; color: white; padding: 20px 40px; text-decoration: none; border-radius: 16px; font-weight: bold; font-size: 18px; display: inline-block;">
                                    Jetzt bei TUI entdecken
                                </a>
                            </div>
                        </div>
                        <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 11px; color: #94a3b8;">
                            &copy; 2026 KI-FERIEN. Basierend auf Sternzeichen ${zodiac}, Alter ${alter} und deinen Vorlieben.
                        </div>
                    </div>`
            }, { idempotencyKey });
        } catch (mailError) {
            console.error("Mail Error:", mailError);
        }

        // 5. Weiterleitung zur success.html (Redirect)
        return {
            statusCode: 302,
            headers: { 
                'Location': '/success.html',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: ''
        };

    } catch (error) {
        console.error("Kritischer Fehler:", error);
        return { 
            statusCode: 302, 
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
