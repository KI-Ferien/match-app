const { Resend } = require('resend');

exports.handler = async (event) => {
    // Falls kein POST-Request vorliegt, sofortiger Abbruch
    if (event.httpMethod !== "POST") {
        return { statusCode: 302, headers: { 'Location': '/' } };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    // Robuster Awin-Link
    const tuiAwinLink = "https://www.awin1.com/awclick.php?mid=12531&id=2734466";

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Reisender";
        const zodiac = params.get('q_zodiac') || "Entdecker";
        const alter = params.get('q_age') || "junggeblieben";
        const slider = params.get('q_adventure') || "ausgeglichen";
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/?error=missing_email' } };
        }

        // 1. KI-Anfrage (Mistral) - Jetzt mit allen Details
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
                    content: `Reiseexperte-Match für ${vorname}: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Abenteuer-Level ${slider}, Interessen: ${hobbys}. Begründe kurz im Text, warum das Ziel zu diesen Details passt. Format: ZIEL: [Ort] ANALYSE: [3 Sätze]`
                }],
                max_tokens: 250
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Traumziel";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Ein perfekt abgestimmtes Ziel.";

        // 2. E-Mail Versand (Abgesichert gegen Abstürze)
        try {
            const today = new Date().toISOString().split('T')[0];
            const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

            await resend.emails.send({
                from: 'KI-FERIEN <info@ki-ferien.de>',
                to: email,
                bcc: 'mikostro@web.de', 
                subject: `Dein Ferien-Match: ${zielName} 🌴`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
                        <div style="background: #eff6ff; padding: 30px; text-align: center;">
                            <h1 style="margin:0;">Hallo ${vorname}!</h1>
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <h2 style="color: #2563eb;">${zielName}</h2>
                            <p style="background: #f8fafc; padding: 15px; border-radius: 10px; text-align: left; line-height: 1.6;">${analyseText}</p>
                            <div style="margin-top: 25px;">
                                <a href="${tuiAwinLink}" style="background: #d40e14; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; display: block; font-weight: bold; font-size: 18px;">Jetzt Ferien bei TUI entdecken</a>
                            </div>
                        </div>
                        <div style="padding: 15px; text-align: center; background: #fafafa; font-size: 10px; color: #999;">
                            Basierend auf Sternzeichen ${zodiac} & Interessen.
                        </div>
                    </div>`
            }, { idempotencyKey });
        } catch (mailError) {
            console.error("Mail-Versand Fehler (wird ignoriert für Redirect):", mailError);
        }

        // 3. Direkte Weiterleitung zur Startseite (wie im Original)
        return {
            statusCode: 302,
            headers: { 
                'Location': '/?success=true',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: ''
        };

    } catch (error) {
        console.error("Kritischer Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/?error=true' }, body: '' };
    }
};
