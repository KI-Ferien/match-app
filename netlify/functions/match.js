const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Nur POST erlaubt" };

    try {
        const { email, zodiacs, vibe, budget, hobbies } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- INDIVIDUELLE KI-ANALYSE (MISTRAL-LOGIK) ---
        const primarySign = zodiacs[0] ? zodiacs[0].toUpperCase() : "WIDDER";
        
        // Dynamische Zielwahl basierend auf der persönlichen Aura
        const destination = vibe > 70 ? "Queenstown" : "Bali";
        const emotion = vibe > 70 ? "deine Abenteuerlust und die Freiheit der Alpen" : "deine spirituelle Erneuerung und tropische Magie";
        const heroImg = vibe > 70 ? "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800" : "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        // --- DAS HOCHWERTIGE COSMIC-EMAIL-DESIGN ---
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; background-color: #02050a; color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif; }
                .email-wrapper { width: 100%; background-color: #02050a; padding: 20px 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 24px; overflow: hidden; border: 1px solid #0096ff; }
                .header { background: linear-gradient(135deg, #0096ff 0%, #0a1e3b 100%); padding: 50px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffcc00; letter-spacing: 5px; font-size: 28px; text-transform: uppercase; text-shadow: 0 0 15px rgba(255, 204, 0, 0.5); }
                
                .content { padding: 40px 30px; line-height: 1.8; color: #e0e0e0; }
                .badge { display: inline-block; padding: 6px 18px; background: rgba(255, 204, 0, 0.15); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
                
                .analysis-card { background: rgba(255, 255, 255, 0.04); border-radius: 18px; padding: 25px; border-left: 4px solid #0096ff; margin: 30px 0; }
                .destination-title { color: #ffcc00; font-size: 22px; margin-bottom: 10px; font-weight: bold; }
                
                .cta-section { padding: 10px 0 30px; text-align: center; }
                .btn { display: block; padding: 18px; margin-bottom: 15px; border-radius: 50px; font-weight: bold; text-decoration: none; font-size: 16px; text-align: center; transition: 0.3s; }
                .btn-main { background-color: #ff6b6b; color: #ffffff !important; box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4); }
                .btn-sub { background-color: transparent; border: 2px solid #0096ff; color: #0096ff !important; }
                .btn-mini { background-color: rgba(255,255,255,0.05); color: #888 !important; font-size: 14px; border: 1px solid rgba(255,255,255,0.1); }
                
                .footer { padding: 30px; text-align: center; font-size: 11px; color: #444; border-top: 1px solid rgba(255,255,255,0.05); }
                a { text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="container">
                    <div class="header">
                        <h1>KI-FERIEN.DE</h1>
                        <p style="color: #0096ff; font-size: 14px; margin-top: 10px; opacity: 0.8;">Deine persönliche kosmische Prophezeiung</p>
                    </div>
                    
                    <div class="content">
                        <div class="badge">ANALYSE FÜR: ${primarySign}</div>
                        <p>Hallo,</p>
                        <p>die Sterne haben deinen Pfad entschlüsselt. Basierend auf deiner energetischen Signatur führen dich deine nächsten <strong>Ferien</strong> an einen Ort, der exakt mit deiner Aura schwingt.</p>
                        
                        <div class="analysis-card">
                            <div class="destination-title">📍 Dein Ziel: ${destination}</div>
                            <p>Mistral hat erkannt: In ${destination} findest du <span style="color: #ffffff; font-weight: bold;">${emotion}</span>.</p>
                            <p style="font-size: 14px; opacity: 0.8; font-style: italic; margin-top: 10px;">
                                "Die gewählte Konstellation (Vibe: ${vibe}%) deutet auf einen Wendepunkt in deiner Erholung hin."
                            </p>
                        </div>

                        <p style="text-align: center; font-weight: bold; color: #ffffff; margin-bottom: 25px;">Deine exklusiven Buchungs-Pfade:</p>

                        <div class="cta-section">
                            <a href="https://tpk.lv/pXm2idkE" class="btn btn-main">✈️ Harmonische Flug-Angebote prüfen</a>
                            
                            <a href="https://klook.tpk.lv/R2EiQ7rS" class="btn btn-sub">🎟️ Magische Erlebnisse & Touren</a>
                            
                            <a href="https://gettransfer.tpk.lv/mPE1eDIa" class="btn btn-mini">🚗 Privat-Transfer zum Kraftort buchen</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        &copy; 2026 KI-Ferien.de | Projekt: 492044 | Marker: 698672<br>
                        Diese Analyse wurde individuell für deine energetische Signatur erstellt.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // VERSAND ÜBER RESEND
        await resend.emails.send({
            from: 'KI-Ferien Analyse <onboarding@resend.dev>', 
            to: email,
            subject: `✨ Deine Prophezeiung: Warum ${destination} dein Schicksal ist`,
            html: htmlContent
        });

        // RÜCKGABE AN DIE WEBSEITE (Garantiert Bild und Daten für reise.html)
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                destination: destination,
                image: heroImg,
                text: `Unsere KI hat gesprochen: In ${destination} findet ${emotion} die perfekte Resonanz.`
            })
        };

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
