const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons, marker, project } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Hier wird die Tonalität für die KI-Analyse definiert
        const mainZodiac = zodiacs[0].toUpperCase();
        const groupContext = zodiacs.length > 1 ? `eurer ${zodiacs.length}er-Konstellation` : "deiner Aura";

        // HTML-Template für die Premium-Email
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #02050a; color: #ffffff; margin: 0; padding: 0; }
                .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 20px; overflow: hidden; border: 1px solid #0096ff; }
                .header { background: linear-gradient(to bottom, #0096ff, #0a1e3b); padding: 40px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffcc00; letter-spacing: 2px; font-size: 24px; }
                .content { padding: 30px; line-height: 1.6; }
                .zodiac-badge { display: inline-block; padding: 5px 15px; background: rgba(255, 204, 0, 0.2); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 15px; font-weight: bold; margin-bottom: 20px; }
                .analysis-box { background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; border-left: 4px solid #0096ff; margin: 20px 0; }
                .cta-button { display: block; width: 250px; margin: 30px auto; padding: 15px; background-color: #ff6b6b; color: #ffffff; text-align: center; font-weight: bold; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4); }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid rgba(255,255,255,0.1); }
                a { color: #0096ff; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <h1>KI-FERIEN.DE</h1>
                    <p>Deine Kosmische Analyse ist bereit</p>
                </div>
                <div class="content">
                    <div class="zodiac-badge">${mainZodiac} & TEAM</div>
                    <p>Hallo,</p>
                    <p>die Sterne haben sich neu ausgerichtet. Basierend auf <strong>${groupContext}</strong> und euren Vorlieben (Vibe: ${vibe}%, Budget-Index: ${budget}) hat unsere KI Mistral das ideale Ziel für eure nächsten Ferien berechnet.</p>
                    
                    <div class="analysis-box">
                        <h3 style="color: #0096ff; margin-top: 0;">✨ Die Prophezeiung</h3>
                        <p>Eure Kombination aus ${zodiacs.join(', ')} verlangt nach einem Ort, der sowohl Tiefe als auch Inspiration bietet. Die Analyse zeigt, dass eure Energien in diesem Jahr besonders stark mit Orten harmonieren, die Wasser und Weite vereinen.</p>
                        <p><em>(Hier fügt dein Mistral-Script den individuellen Text ein, inkl. Hobbies wie ${hobbies})</em></p>
                    </div>

                    <h3 style="color: #ffcc00; text-align: center;">Deine exklusiven Buchungs-Pfade:</h3>
                    
                    <a href="https://tp.media/r?marker=${marker}&trs=12345&p=4113&u=https%3A%2F%2Fwww.aviasales.com" class="cta-button">Passende Flüge finden</a>
                    
                    <a href="https://tp.media/r?marker=${marker}&trs=12345&p=4113&u=https%3A%2F%2Fsearch.hotellook.com" class="cta-button" style="background-color: #0096ff;">Top-Hotels sichern</a>

                    <p style="font-size: 13px; text-align: center; opacity: 0.7;">
                        Wichtig: Diese Angebote sind energetisch auf eure Gruppe abgestimmt. Nutze die Links oben, um direkt zu buchen.
                    </p>
                </div>
                <div class="footer">
                    &copy; 2026 KI-Ferien.de | Projekt: ${project}<br>
                    <a href="https://ki-ferien.de">Besuche uns erneut für neue Konstellationen</a>
                </div>
            </div>
        </body>
        </html>
        `;

        await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>',
            to: email,
            subject: `✨ Deine Analyse für ${mainZodiac}: Die perfekten Ferien warten!`,
            html: htmlContent
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Email erfolgreich versandt" }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
