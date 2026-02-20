const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- DER INDIVIDUELLE FOKUS (DAS HAUPTSTERNZEICHEN) ---
        const primarySign = zodiacs[0].charAt(0).toUpperCase() + zodiacs[0].slice(1);
        
        // Dynamische Zielwahl basierend auf der persönlichen Aura
        let destination = "Bali";
        let personalPath = "deine spirituelle Erneuerung und das Finden deiner inneren Mitte";
        let heroImg = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        if (vibe > 75) {
            destination = "Queenstown";
            personalPath = "deinen Drang nach Freiheit und das Überschreiten deiner eigenen Grenzen";
            heroImg = "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800";
        } else if (zodiacs[0] === 'krebs' || zodiacs[0] === 'fische') {
            destination = "Cornwall";
            personalPath = "deine emotionale Heilung im Einklang mit den heilenden Kräften des Meeres";
            heroImg = "https://images.unsplash.com/photo-1510253451774-67f781f8f782?w=800";
        }

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
                .personal-badge { display: inline-block; padding: 5px 18px; background: rgba(255, 204, 0, 0.15); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
                .analysis-box { background: rgba(255, 255, 255, 0.04); border-radius: 18px; padding: 25px; border-left: 4px solid #0096ff; margin: 30px 0; }
                .cta-group { margin-top: 35px; }
                .cta-button { display: block; padding: 18px; margin-bottom: 15px; text-align: center; background: #ff6b6b; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4); }
                .secondary-btn { background: transparent; border: 2px solid #0096ff; color: #0096ff !important; }
                .footer { padding: 30px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid rgba(255,255,255,0.05); }
                .highlight { color: #ffcc00; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero-header">
                    <h1>KI-FERIEN.DE</h1>
                    <p style="opacity: 0.8; font-size: 14px;">Deine ganz persönliche Prophezeiung</p>
                </div>
                <div class="content">
                    <div class="personal-badge">FÜR DICH: ${primarySign.toUpperCase()}</div>
                    <p>Hallo,</p>
                    <p>unsere KI Mistral hat deine energetische Signatur entschlüsselt. In den kommenden <strong>Ferien</strong> geht es nicht nur um den Ort, sondern um <strong>dich</strong>.</p>
                    
                    <div class="analysis-box">
                        <h3 style="color: #0096ff; margin-top: 0;">✨ Dein Pfad in ${destination}</h3>
                        <p>Für dich als <span class="highlight">${primarySign}</span> ist dieser Ort ein Portal für <span style="color:#ffffff;">${personalPath}</span>.</p>
                        <p>Deine Wahl (Vibe: ${vibe}%) zeigt uns, dass du bereit bist, diesen nächsten Schritt auf deiner persönlichen Reise zu gehen. Deine Begleiter werden von dieser Energie profitieren, während du das Zentrum dieser Erfahrung bist.</p>
                    </div>

                    <p style="text-align: center; font-weight: bold; margin-bottom: 25px;">Folge deinem kosmischen Ruf:</p>

                    <div class="cta-group">
                        <a href="
