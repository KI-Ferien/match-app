const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Nur POST erlaubt" };

    try {
        const { email, zodiacs, vibe } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- KONTEXT-CHECK ---
        const primarySign = zodiacs[0] ? zodiacs[0].toUpperCase() : "WIDDER";
        const destination = vibe > 70 ? "Queenstown" : "Bali";
        const emotion = vibe > 70 ? "deine Abenteuerlust" : "deine spirituelle Erneuerung";
        const heroImg = vibe > 70 ? "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800" : "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";
        
        // --- BULLETPROOF EMAIL TEMPLATE (INLINE CSS) ---
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #02050a; color: #ffffff; padding: 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 16px; overflow: hidden; border: 1px solid #0096ff;">
                
                <div style="background-color: #0096ff; padding: 40px 20px;">
                    <h1 style="margin: 0; color: #ffcc00; letter-spacing: 4px; font-size: 24px; text-transform: uppercase;">KI-FERIEN.DE</h1>
                    <p style="color: #ffffff; font-size: 14px; margin-top: 10px;">Kosmische Analyse</p>
                </div>
                
                <div style="padding: 30px 20px; text-align: left; color: #e0e0e0; line-height: 1.6;">
                    <div style="display: inline-block; padding: 5px 15px; background-color: rgba(255, 204, 0, 0.1); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 15px; font-weight: bold; font-size: 13px; margin-bottom: 20px;">
                        FÜR: ${primarySign}
                    </div>
                    
                    <p>Hallo,</p>
                    <p>die Sterne haben deinen Pfad entschlüsselt. Für deine nächsten <strong>Ferien</strong> steht ein Ziel bereit, das exakt mit deiner Aura schwingt: <strong style="color: #ffcc00; font-size: 18px;">${destination}</strong>.</p>
                    <p>Hier findet <strong>${emotion}</strong> die perfekte Resonanz.</p>

                    <div style="background-color: #071529; border-radius: 16px; padding: 30px 20px; margin: 30px 0; border: 1px solid #1a3a63; text-align: center;">
                        <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 25px; font-size: 18px;">Deine exklusiven Buchungs-Pfade:</h3>
                        
                        <a href="https://tpk.lv/pXm2idkE" style="display: block; width: 85%; margin: 0 auto 15px auto; padding: 16px 10px; background-color: #ff6b6b; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
                            ✈️ Flug-Angebote prüfen
                        </a>
                        
                        <a href="https://klook.tpk.lv/R2EiQ7rS" style="display: block; width: 85%; margin: 0 auto 15px auto; padding: 16px 10px; background-color: #0096ff; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
                            🎟️ Erlebnisse & Touren
                        </a>
                        
                        <a href="https://gettransfer.tpk.lv/mPE1eDIa" style="display: block; width: 85%; margin: 0 auto; padding: 14px 10px; background-color: transparent; border: 2px solid #444444; color: #aaaaaa; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">
                            🚗 Privat-Transfer buchen
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; background-color: #051024; text-align: center; font-size: 11px; color: #555555; border-top: 1px solid #1a2a42;">
                    © 2026 KI-FERIEN.DE<br><br>
                    <span style="opacity: 0.5;">Projekt: 492044 | Marker: 698672</span><br><br>
                    <a href="https://ki-ferien.de" style="color: #0096ff; text-decoration: none;">Neue Analyse starten</a>
                </div>
            </div>
        </div>
        `;

        // --- VERSAND ---
        await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>', 
            to: email,
            subject: `✨ Deine Prophezeiung für ${destination}`,
            html: htmlContent
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                destination: destination,
                image: heroImg,
                text: "Analyse erfolgreich."
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
