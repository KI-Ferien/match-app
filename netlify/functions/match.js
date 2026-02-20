const { Resend } = require('resend');

exports.handler = async (event) => {
    // Sicherheits-Check: Nur POST-Anfragen
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Nur POST erlaubt" };
    }

    try {
        const body = JSON.parse(event.body);
        const { email, zodiacs, vibe, budget, hobbies, persons } = body;

        // Dein API-Key muss in den Netlify Environment Variables als RESEND_API_KEY hinterlegt sein
        const resend = new Resend(process.env.RESEND_API_KEY);

        // --- INDIVIDUELLE ANALYSE-LOGIK ---
        const primarySign = zodiacs[0] ? zodiacs[0].toLowerCase() : "widder";
        
        // Datenbank der Destinationen & Bilder (Unsplash)
        const destMap = {
            widder: { t: "Vulkane Islands", i: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800", p: "deinen Tatendrang" },
            stier: { t: "Toskana Genuss", i: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=800", p: "deine Sinnlichkeit" },
            zwillinge: { t: "Tokio Metropole", i: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", p: "deine Neugier" },
            krebs: { t: "Cornwall Küste", i: "https://images.unsplash.com/photo-1510253451774-67f781f8f782?w=800", p: "deine Seele" },
            loewe: { t: "Safari Namibia", i: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800", p: "dein Strahlen" },
            jungfrau: { t: "Schweizer Alpen", i: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", p: "deine Klarheit" },
            waage: { t: "Santorini Design", i: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", p: "deine Ästhetik" },
            skorpion: { t: "Marrakesch Mystik", i: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800", p: "deine Tiefe" },
            schuetze: { t: "Patagonien Freiheit", i: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800", p: "deine Abenteuerlust" },
            steinbock: { t: "Südtirol Gipfel", i: "https://images.unsplash.com/photo-1533560225433-87593c6f9664?w=800", p: "deine Beständigkeit" },
            wassermann: { t: "Lappland Vision", i: "https://images.unsplash.com/photo-1531366930075-410a88094957?w=800", p: "deine Freiheit" },
            fische: { t: "Bali Träume", i: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", p: "deine Träume" }
        };

        let choice = destMap[primarySign] || destMap.widder;
        if (vibe > 80) {
            choice = { t: "Action-Highlight: Queenstown", i: "https://images.unsplash.com/photo-1589802829985-817e51181b92?w=800", p: "dein Adrenalin" };
        }

        // --- EMAIL VERSAND (ASYNC) ---
        const htmlContent = `
            <div style="background-color: #02050a; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px;">
                <h1 style="color: #ffcc00;">KI-FERIEN.DE</h1>
                <p>Hallo,</p>
                <p>die Sterne haben deinen Pfad nach <strong>${choice.t}</strong> geebnet. In diesen <strong>Ferien</strong> steht ${choice.p} im Mittelpunkt.</p>
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #0096ff;">
                    <p>Dein kosmisches Ziel ist bereit für dich.</p>
                </div>
                <a href="https://tpk.lv/pXm2idkE" style="display: block; background: #ff6b6b; color: white; padding: 15px; text-align: center; border-radius: 50px; text-decoration: none; font-weight: bold; margin-top: 20px;">✈️ Deine Reise nach ${choice.t} planen</a>
                <a href="https://klook.tpk.lv/R2EiQ7rS" style="display: block; text-align: center; color: #0096ff; text-decoration: none; margin-top: 15px;">🎟️ Magische Erlebnisse vor Ort</a>
                <p style="font-size: 10px; color: #555; margin-top: 30px;">Projekt: 492044 | Marker: 698672</p>
            </div>
        `;

        try {
            await resend.emails.send({
                from: 'KI-Ferien Analyse <info@ki-ferien.de>',
                to: email,
                subject: `✨ Deine Prophezeiung: Warum ${choice.t} dein Schicksal ist`,
                html: htmlContent
            });
            console.log("Email erfolgreich versandt an:", email);
        } catch (mailError) {
            console.error("Resend Error:", mailError);
            // Wir machen trotzdem weiter, damit die Webseite nicht leer bleibt!
        }

        // --- ANTWORT AN DIE WEBSEITE (WICHTIG FÜR DAS BILD) ---
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                destination: choice.t,
                image: choice.i, // Dieser Key muss exakt "image" heißen für reise.html
                text: `Unsere Analyse zeigt: In ${choice.t} findet ${choice.p} die perfekte Resonanz.`
            })
        };

    } catch (error) {
        console.error("Funktions-Fehler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
