const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons, marker, project } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // 1. DYNAMISCHE KI-LOGIK (MISTRAL-SIMULATION)
        // Hier wird die Destination basierend auf echten Daten gewählt
        const primarySign = zodiacs[0].charAt(0).toUpperCase() + zodiacs[0].slice(1);
        
        // Logik für die Zielwahl (wird in der Email dynamisch eingesetzt)
        let destination = "Bali";
        let vibeText = "spirituelle Erneuerung und tropische Gelassenheit";
        
        if (vibe > 70) {
            destination = "Queenstown";
            vibeText = "Adrenalin, Weite und ultimative Freiheit";
        } else if (zodiacs.includes('krebs') || zodiacs.includes('fische')) {
            destination = "Cornwall";
            vibeText = "tiefe emotionale Geborgenheit und mystische Küstenmagie";
        }

        // 2. PSYCHOLOGISCH OPTIMIERTES HTML-TEMPLATE
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #02050a; color: #ffffff; margin: 0; padding: 0; }
                .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 24px; overflow: hidden; border: 1px solid rgba(0, 150, 255, 0.3); }
                .hero { background: linear-gradient(135deg, #0096ff 0%, #0a1e3b 100%); padding: 50px 30px; text-align: center; }
                .hero h1 { margin: 0; font-size: 28px; letter-spacing: 3px; color: #ffcc00; text-transform: uppercase; }
                .badge { display: inline-block; padding: 6px 18px; background: rgba(255, 204, 0, 0.15); border: 1px solid #ffcc00; color: #ffcc00; border-radius: 20px; font-weight: bold; font-size: 14px; margin-top: 15px; }
                
                .content { padding: 40px 30px; line-height: 1.8; color: #e0e0e0; }
                .analysis-card { background: rgba(255, 255, 255, 0.03); border-radius: 16px; padding: 25px; border-left: 5px solid #0096ff; margin: 30px 0; }
                .highlight { color: #0096ff; font-weight: bold; }
                
                .cta-section { text-align: center; padding: 20px 0 40px; }
                .btn { display: inline-block; width: 85%; padding: 18px; margin: 10px 0; border-radius: 50px; font-weight: bold; text-decoration: none; font-size: 16px; transition: 0.3s; text-align: center; }
                .btn-primary { background: #ff6b6b; color: white; box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3); }
                .btn-secondary { background: transparent; border: 2px solid #0096ff; color: #0096ff; }
                
                .footer { background: rgba(0,0,0,0.3); padding: 30px; text-align: center; font-size: 12px; color: #666; }
                .footer a { color: #888; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero">
                    <h1>KI-FERIEN.DE</h1>
                    <div class="badge">KONSTELLATION: ${primarySign} + ${persons-1}</div>
                </div>
                
                <div class="content">
                    <p>Hallo,</p>
                    <p>unsere KI-Engine <strong>Mistral</strong> hat die energetischen Signaturen eurer Gruppe entschlüsselt. Die Sterne stehen aktuell in einer seltenen Harmonie für eure geplanten <strong>Ferien</strong>.</p>
                    
                    <div class="analysis-card">
                        <h3 style="color: #ffcc00; margin-top: 0;">📍 Euer kosmisches Ziel: ${destination}</h3>
                        <p>Basierend auf eurem Vibe-Profil (${vibe}%) und den Hobbies (${hobbies || 'Entdeckung'}) ist <span class="highlight">${destination}</span> der Ort, an dem eure kollektive Energie am stärksten schwingt.</p>
                        <p>Hier findet ihr <strong>${vibeText}</strong>. Es ist kein Zufall, dass genau diese Destination jetzt in eurer Analyse erscheint.</p>
                    </div>

                    <p style="text-align: center; font-weight: bold; color: #ffffff;">Handelt jetzt, solange die Konstellation stabil ist:</p>

                    <div class="cta-section">
                        <a href="https://tp.media/r?marker=${marker}&p=4113&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%3Fdestination%3D${destination}" class="btn btn-primary">
                            ✈️ Harmonische Flüge nach ${destination} prüfen
                        </a>
                        
                        <a href="https://tp.media/r?marker=${marker}&p=4113&u=https%3A%2F%2Fsearch.hotellook.com%2Fhotels%3Flocation%3D${destination}" class="btn btn-secondary">
                            🏨 Kraftorte & Unterkünfte in ${destination}
                        </a>
                    </div>
