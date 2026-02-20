const { Resend } = require('resend');

exports.handler = async (event) => {
    // 1. Initialisierung
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Nur POST erlaubt" };

    try {
        const body = JSON.parse(event.body);
        const { email, zodiacs, vibe, budget, hobbies } = body;
        
        // Netlify zieht den Key aus den Environment Variables
        const resend = new Resend(process.env.RESEND_API_KEY);
        const primarySign = zodiacs[0] ? zodiacs[0].toUpperCase() : "WIDDER";
        
        // 2. Dynamische Inhaltswahl (Bild & Text)
        const destination = vibe > 70 ? "Queenstown" : "Bali";
        const emotion = vibe > 70 ? "deine Abenteuerlust und die Freiheit der Alpen" : "deine spirituelle Erneuerung und tropische Magie";
        const heroImg = vibe > 70 ? "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800" : "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800";

        // 3. Das Cosmic-Email-Template (Optimierter Aufbau mit allen 3 Links)
        const htmlContent = `
        <div style="background-color: #02050a; color: #ffffff; padding: 40px; font-family: 'Helvetica', Arial, sans-serif; border-radius: 20px; border: 1px solid #0096ff; max-width: 600px; margin: auto;">
            <h1 style="color: #ffcc00; text-align: center; letter-spacing: 4px;">KI-FERIEN.DE</h1>
            <p style="text-align: center; font-size: 14px; color: #0096ff;">Deine persönliche kosmische Analyse</p>
            
            <div style="margin: 25px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 15px; border-left: 4px solid #ffcc00;">
                <p>Hallo,</p>
                <p>für dich als <strong>${primarySign}</strong> wurde ein Ziel identifiziert, das exakt mit deiner Aura schwingt: <span style="color: #ffcc00;"><strong>${destination}</strong></span>.</p>
                <p>In ${destination} findest du <strong>${emotion}</strong>.</p>
            </div>

            <p style="font-weight: bold; text-align: center; margin-bottom: 20px;">Sichere dir jetzt deine Ferien-Angebote:</p>

            <div style="text-align: center;">
                <a href="https://tpk.lv/pXm2idkE" style="display: block; background: #ff6b6b; color: white; padding: 18px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-bottom: 12px;">✈️ Passende Flüge nach ${destination}</a>
                
                <a href="https://klook.tpk.lv/R2EiQ7rS" style="display: block; border: 2px solid #0096ff; color: #0096ff; padding: 15px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-bottom: 12px;">🎟️ Magische Erlebnisse vor Ort</a>
                
                <a href="https://gettransfer.tpk.lv/mPE1eDIa" style="display: block; color: #555; font-size: 13px; text-decoration: none; margin-top: 10px;">🚗 Privat-Transfer zum Kraftort buchen</a>
            </div>
            
            <p style="font-size: 10px; color: #444; text-align: center; margin-top: 40px;">Projekt: 492044 | Marker: 698672</p>
        </div>`;

        // 4. Der Email-Versand-Prozess
        try {
            await resend.emails.send({
                from: 'KI-Ferien Analyse <onboarding@resend.dev>', // WICHTIG: Teste hiermit!
                to: email,
                subject: `✨ Deine Prophezeiung für ${destination} ist da!`,
                html: htmlContent
            });
        } catch (mailError) {
            console.error("Resend Error:", mailError.message);
            // Wir lassen die Funktion weiterlaufen, damit das Bild auf der Webseite erscheint!
        }

        // 5. Erfolgreiche Rückgabe an die Webseite (Bild-Garantie)
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                destination: destination,
                image: heroImg, // Hier wird das Bild für reise.html übergeben
                text: `In ${destination} findet ${emotion} die perfekte Resonanz.`
            })
        };

    } catch (error) {
        console.error("Handler Error:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
