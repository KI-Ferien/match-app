const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- KONTEXT-CHECK (INDIVIDUELL) ---
        const primarySign = zodiacs[0] ? zodiacs[0].toUpperCase() : "WIDDER";
        const destination = vibe > 70 ? "Queenstown" : "Bali";
        const emotion = vibe > 70 ? "deine Abenteuerlust" : "deine spirituelle Erneuerung";
        
        // --- PREMIUM EMAIL TEMPLATE ---
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background-color: #02050a; font-family: 'Helvetica Neue', Arial, sans-serif; color: #ffffff; }
                .wrapper { width: 100%; background-color: #02050a; padding: 40px 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 24px; overflow: hidden; border: 1px solid #0096ff; }
                .header { background: linear-gradient(135deg, #0096ff 0%, #0a1e3b 100%); padding: 50px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffcc00; letter-spacing: 5px; font-size: 26px; text-transform: uppercase; }
                
                .content { padding: 40px 30px; line-height: 1.8; color: #e0e0e0; }
                .badge { display: inline-block; padding: 5px 15px; background: rgba(255, 204, 0, 0.1); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 15px; font-weight: bold; font-size: 13px; margin-bottom: 20px; }
                
                .action-area { background: rgba(255, 255, 255, 0.03); border-radius: 20px; padding: 30px; margin: 30px 0; border: 1px solid rgba(0, 150, 255, 0.2); }
                .btn { display: block; padding: 18px; margin-bottom: 12px; border-radius: 50px; font-weight: bold; text-decoration: none; text-align: center; font-size: 16px; }
                .btn-flight { background-color: #ff6b6b; color: #ffffff !important; }
                .btn-klook { background-color: #0096ff; color: #ffffff !important; }
                .btn-transfer { background-color: transparent; border: 1px solid #444; color: #888 !important; font-size: 14px; }
                
                .footer { padding: 30px; text-align: center; font-size: 10px; color: #333; border-top: 1px solid rgba(255,255,255,0.05); }
                .footer a { color: #333; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <h1>KI-FERIEN.DE</h1>
                        <p style="color: #0096ff; font-size: 14px; margin-top: 10px;">Deine persönliche kosmische Analyse</p>
                    </div>
                    
                    <div class="content">
                        <div class="badge">ANALYSE FÜR: ${primarySign}</div>
                        <p>Hallo,</p>
                        <p>die Sterne haben deinen Pfad entschlüsselt. Unsere KI-Analyse zeigt, dass für deine nächsten <strong>Ferien</strong> ein Ziel bereitsteht, das exakt mit deiner Aura schwingt: <strong style="color: #ffcc00;">${destination}</strong>.</p>
                        
                        <p>Hier findet <strong>${emotion}</strong> die perfekte Resonanz.</p>

                        <div class="action-area">
                            <h3 style="color: #ffffff; text-align: center; margin-top: 0; font-size: 18px;">Deine exklusiven Buchungs-Pfade:</h3>
                            
                            <a href="https://tpk.lv/pXm2idkE" class="btn btn-flight">✈️ Harmonische Flug-Angebote prüfen</a>
                            <a href="https://klook.tpk.lv/R2EiQ7rS" class="btn btn-klook">🎟️ Magische Erlebnisse & Touren</a>
                            <a href="https://gettransfer.tpk.lv/mPE1eDIa" class="btn btn-transfer">🚗 Privat-Transfer zum Kraftort buchen</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        © 2026 KI-FERIEN.DE | P-ID: 492044 | M: 698672<br>
                        Sterne deuten. Ferien planen. <a href="https://ki-ferien.de">Neu berechnen</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // --- VERSAND ---
        await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>', 
            to: email,
            subject: `✨ Deine Prophezeiung für ${destination} ist da!`,
            html: htmlContent
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                destination: destination,
                image: vibe > 70 ? "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800" : "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
                text: "Analyse erfolgreich. Schau in dein Postfach!"
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
