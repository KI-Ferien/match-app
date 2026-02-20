const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- DYNAMISCHE KI-ANALYSE ---
        const primarySign = zodiacs[0].toUpperCase();
        let destination = "Bali";
        let emotion = "spirituelle Erneuerung und tropische Magie";
        let heroImg = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        if (vibe > 75) {
            destination = "Queenstown";
            emotion = "pures Adrenalin und die Freiheit der Alpen";
            heroImg = "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800";
        } else if (zodiacs.includes('krebs') || zodiacs.includes('fische')) {
            destination = "Cornwall";
            emotion = "mystische Küstenpfade und tiefe Geborgenheit";
            heroImg = "https://images.unsplash.com/photo-1510253451774-67f781f8f782?w=800";
        }

        // --- EMAIL TEMPLATE ---
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; background-color: #02050a; color: #ffffff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: #0a1e3b; border-radius: 24px; overflow: hidden; border: 1px solid #0096ff; }
                .hero-header { background: linear-gradient(135deg, #0096ff, #0a1e3b); padding: 50px 20px; text-align: center; }
                .hero-header h1 { margin: 0; color: #ffcc00; letter-spacing: 4px; font-size: 26px; text-transform: uppercase; }
                .content { padding: 40px 30px; line-height: 1.8; }
                .badge { display: inline-block; padding: 5px 15px; background: rgba(255, 204, 0, 0.1); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 15px; font-weight: bold; font-size: 13px; margin-bottom: 20px; }
                .analysis-box { background: rgba(255, 255, 255, 0.04); border-radius: 15px; padding: 25px; border-left: 4px solid #0096ff; margin: 25px 0; }
                
                .cta-group { margin-top: 30px; }
                .cta-button { display: block; padding: 18px; margin-bottom: 12px; text-align: center; background: #ff6b6b; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3); }
                .secondary-btn { background: transparent; border: 2px solid #0096ff; color: #0096ff !important; box-shadow: none; }
                .tertiary-btn { background: rgba(255,255,255,0.05); color: #ffffff !important; border: 1px solid rgba(255,255,255,0.2); }
                
                .footer { padding: 30px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid rgba(255,255,255,0.05); }
                .highlight { color: #0096ff; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero-header">
                    <h1>KI-FERIEN.DE</h1>
                    <p style="opacity: 0.8; font-size: 14px;">Deine exklusive kosmische Prophezeiung</p>
                </div>
                <div class="content">
                    <div class="badge">KONSTELLATION: ${primarySign}</div>
                    <p>Hallo,</p>
                    <p>unsere KI Mistral hat die Energien entschlüsselt. Dein kosmisches Ziel für die nächsten <strong>Ferien</strong> ist <span class="highlight">${destination}</span>.</p>
                    
                    <div class="analysis-box">
                        <h3 style="color: #ffcc00; margin-top: 0;">✨ Warum dieses Ziel?</h3>
                        <p>Eure Konstellation verlangt nach <strong>${emotion}</strong>. Euer Vibe-Profil von ${vibe}% harmoniert perfekt mit der Schwingung dieses Ortes.</p>
                    </div>

                    <p style="text-align: center; font-weight: bold; margin-bottom: 20px;">Deine personalisierten Buchungs-Pfade:</p>

                    <div class="cta-group">
                        <a href="https://tpk.lv/pXm2idkE" class="cta-button">
                            ✈️ Flüge & Angebote für ${destination} prüfen
                        </a>
                        
                        <a href="https://klook.tpk.lv/R2EiQ7rS" class="cta-button secondary-btn">
                            🎟️ Magische Erlebnisse & Touren vor Ort
                        </a>
                        
                        <a href="https://gettransfer.tpk.lv/mPE1eDIa" class="cta-button tertiary-btn">
                            🚗 Entspannter Transfer zum Kraftort
                        </a>
                    </div>

                    <p style="font-size: 12
