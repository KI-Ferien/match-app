const { Resend } = require('resend');

exports.handler = async (event) => {
    // CORS & Method Check
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Nur POST erlaubt" };
    }

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons, marker, project } = JSON.parse(event.body);
        
        // Initialisiere Resend mit deinem Key aus Netlify
        const resend = new Resend(process.env.RESEND_API_KEY);

        // 1. DYNAMISCHE KI-LOGIK (MISTRAL-STIL)
        const primarySign = zodiacs[0].toUpperCase();
        let dest = "Bali";
        let vibeMsg = "spirituelle Tiefe und tropische Erneuerung";
        let heroImg = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        if (vibe > 75) {
            dest = "Queenstown";
            vibeMsg = "pures Adrenalin und grenzenlose Freiheit";
            heroImg = "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800";
        } else if (zodiacs.includes('krebs') || zodiacs.includes('fische')) {
            dest = "Cornwall";
            vibeMsg = "emotionale Geborgenheit an mystischen Küsten";
            heroImg = "https://images.unsplash.com/photo-1510253451774-67f781f8f782?w=800";
        }

        // 2. HIGH-CONVERSION EMAIL TEMPLATE
        const emailHtml = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #02050a; color: #ffffff; margin: 0; padding: 0; }
                .card { max-width: 600px; margin: 20px auto; background: #0a1e3b; border-radius: 20px; overflow: hidden; border: 1px solid #0096ff; }
                .banner { background: linear-gradient(135deg, #0096ff, #0a1e3b); padding: 40px; text-align: center; }
                .content { padding: 30px; line-height: 1.7; }
                .analysis { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border-left: 4px solid #ffcc00; margin: 20px 0; }
                .cta-btn { display: block; padding: 18px; margin: 15px 0; text-align: center; background: #ff6b6b; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 5px 15px rgba(255,107,107,0.4); }
                .secondary-btn { background: #0096ff; }
                .footer { padding: 20px; text-align: center; font-size: 11px; color: #666; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="banner">
                    <h1 style="color:#ffcc00; margin:0; letter-spacing:3px;">KI-FERIEN.DE</h1>
                    <p style="margin-top:10px; opacity:0.8;">Deine Kosmische Prophezeiung</p>
                </div>
                <div class="content">
                    <div style="text-align:center; margin-bottom:20px;">
                        <span style="border:1px solid #ffcc00; color:#ffcc00; padding:5px 15px; border-radius:15px; font-size:12px; font-weight:bold;">KONSTELLATION: ${primarySign}</span>
                    </div>
                    <p>Hallo,</p>
                    <p>die Sterne haben sich neu ausgerichtet. Unsere KI Mistral hat <strong>${dest}</strong> als deinen ultimativen Kraftort für die nächsten Ferien identifiziert.</p>
                    
                    <div class="analysis">
                        <h3 style="color:#0096ff; margin-top:0;">✨ Warum ${dest}?</h3>
                        <p>Eure Gruppen-Energie verlangt nach <strong>${vibeMsg}</strong>. Die gewählten Parameter (Vibe: ${vibe}%) harmonieren perfekt mit der energetischen Signatur dieses Ortes.</p>
                        <p>Hobbies wie <em>"${hobbies || 'Entdeckung'}"</em> lassen sich dort ideal in den kosmischen Rhythmus integrieren.</p>
                    </div>

                    <p style="text-align:center; font-weight:bold; margin-top:30px;">Nutze das aktuelle Zeitfenster für die beste Buchung:</p>
                    
                    <a href="https://tp.media/r?marker=${marker}&p=4113&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%3Fdestination%3D${dest}" class="cta-btn">✈️ Passende Flüge nach ${dest}</a>
                    
                    <a href="https://tp.media/r?marker=${marker}&p=4113&u=https%3A%2F%2Fsearch.hotellook.com%2Fhotels%3Flocation%3D${dest}" class="cta-btn secondary-btn">🏨 Kraftorte & Hotels in ${dest}</a>

                    <p style="font-size:12px; text-align:center; opacity:0.6; margin-top:30px;">
                        Diese Analyse basiert auf deinem Budget-Profil von ${budget}/100 und ist energetisch auf deine Anfrage optimiert.
                    </p>
                </div>
                <div class="footer">
                    &copy; 2026 KI-Ferien.de | Projekt: ${project}<br>
                    Dein kosmischer Partner für intelligente Ferien-Planung.
                </div>
            </div>
        </body>
        </html>
        `;

        // 3. VERSAND ÜBER RESEND
        const sendResult = await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>',
            to: email,
            subject: `✨ Prophezeiung: Warum ${dest} euer Schicksal ist`,
            html: emailHtml
        });

        // 4. RESPONSE FÜR DIE WEBSEITE
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                success: true, 
                dest: dest,
                title: vibe > 75 ? "Action-Highlight" : "Kosmische Harmonie",
                text: vibeMsg,
                image: heroImg
            })
        };

    } catch (error) {
        console.error("Resend Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Versand fehlgeschlagen: " + error.message }) 
        };
    }
};
