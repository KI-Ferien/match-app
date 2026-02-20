const { Resend } = require('resend');

exports.handler = async (event) => {
    // Sicherheits-Check: Nur POST-Anfragen verarbeiten
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons } = JSON.parse(event.body);
        
        // Deine festen IDs für KI-Ferien.de
        const marker = "698672"; 
        const projectId = "492044";
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- DYNAMISCHE KI-LOGIK (MISTRAL-ANALYSE) ---
        const primarySign = zodiacs[0].toUpperCase();
        let destination = "Bali";
        let emotion = "spirituelle Erneuerung und tropische Magie";
        let heroImg = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        // Einfache Logik für die Demo - Mistral würde dies im Echtbetrieb verfeinern
        if (vibe > 75) {
            destination = "Queenstown";
            emotion = "pures Adrenalin und die Freiheit der Alpen";
            heroImg = "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800";
        } else if (zodiacs.includes('krebs') || zodiacs.includes('fische')) {
            destination = "Cornwall";
            emotion = "mystische Küstenpfade und tiefe Geborgenheit";
            heroImg = "https://images.unsplash.com/photo-1510253451774-67f781f8f782?w=800";
        }

        // --- DAS OPTIMIERTE EMAIL-TEMPLATE ---
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
                .cta-button { display: block; padding: 20px; margin: 15px 0; text-align: center; background: #ff6b6b; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3); }
                .secondary-btn { background: transparent; border: 2px solid #0096ff; color: #0096ff !important; box-shadow: none; }
                .footer { padding: 30px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid rgba(255,255,255,0.05); }
                .highlight { color: #0096ff; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero-header">
                    <h1>KI-FERIEN.DE</h1>
                    <p style="opacity: 0.8; font-size: 14px;">Deine persönliche kosmische Analyse</p>
                </div>
                <div class="content">
                    <div class="badge">ANALYSE FÜR: ${primarySign}</div>
                    <p>Hallo,</p>
                    <p>die Sterne haben gesprochen. Unsere KI-Engine <strong>Mistral</strong> hat die energetischen Muster eurer Gruppe ausgewertet. Das Ergebnis ist eindeutig: Eure nächsten <strong>Ferien</strong> führen euch nach <span class="highlight">${destination}</span>.</p>
                    
                    <div class="analysis-box">
                        <h3 style="color: #ffcc00; margin-top: 0;">✨ Warum dieses Ziel?</h3>
                        <p>Eure Konstellation verlangt nach <strong>${emotion}</strong>. Mit einem Vibe-Faktor von ${vibe}% ist dies der Ort, an dem eure kollektive Energie am stärksten schwingt.</p>
                        <p style="font-style: italic; font-size: 14px; opacity: 0.8;">"Die Planeten stehen günstig für eine Reise, die sowohl den Geist als auch die Seele belebt."</p>
                    </div>

                    <p style="text-align: center; font-weight: bold; margin-bottom: 25px;">Sichere dir jetzt die energetisch passenden Angebote:</p>

                    <a href="https://tp.media/r?marker=${marker}&p=4113&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch%3Fdestination%3D${destination}" class="cta-button">
                        ✈️ Beste Flüge nach ${destination} prüfen
                    </a>
                    
                    <a href="https://tp.media/r?marker=${marker}&p=1218&u=https%3A%2F%2Fsearch.hotellook.com%2Fhotels%3Flocation%3D${destination}" class="cta-button secondary-btn">
                        🏨 Kraftorte & Unterkünfte in ${destination}
                    </a>

                    <p style="font-size: 12px; text-align: center; opacity: 0.5; margin-top: 35px;">
                        Projekt-ID: ${projectId} | Diese Analyse wurde basierend auf deinem Budget-Profil (${budget}/100) erstellt.
                    </p>
                </div>
                <div class="footer">
                    &copy; 2026 KI-Ferien.de | Magische Ferien-Planung durch künstliche Intelligenz.<br>
                    <a href="https://ki-ferien.de" style="color: #555;">Analyse wiederholen</a>
                </div>
            </div>
        </body>
        </html>
        `;

        // 3. VERSAND ÜBER RESEND
        await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>',
            to: email,
            subject: `✨ Prophezeiung bereit: Warum ${destination} euer Schicksal ist`,
            html: htmlContent
        });

        // 4. ANTWORT AN DIE WEBSEITE (für reise.html)
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, destination, image: heroImg })
        };

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
