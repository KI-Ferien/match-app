

exports.handler = async (event) => {
    // Nur POST-Anfragen zulassen
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Daten aus dem Formular auslesen
        const body = event.isBase64Encoded 
            ? Buffer.from(event.body, 'base64').toString() 
            : event.body;
        const data = Object.fromEntries(new URLSearchParams(body));

        // Variablen definieren
        const emailUser = data.email || "Keine E-Mail";
        const sternzeichen = data.q_zodiac || "Reisender";
        const alter = data.q_age || "??";
        const sehnsucht = data.q_sehnsucht || "3";
        const aktivitaet = data.q_activity || "3";

        // Die URL zu deinem Logo auf deiner neuen Domain
        const logoUrl = "https://ki-ferien.de/img/logo.png"; 

        // Das schicke E-Mail Design für den Nutzer
        const emailHtml = `
            <div style="font-family: 'Georgia', serif; background-color: #f9f7f2; padding: 40px; color: #444;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
                    
                    <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                        <img src="${logoUrl}" alt="KI-Ferien Logo" style="width: 100px; height: auto; border-radius: 50%;">
                        <h1 style="color: #4a4a4a; font-size: 24px; margin-top: 20px; font-weight: 300; letter-spacing: 1px;">Deine Analyse ist bereit</h1>
                    </div>

                    <div style="padding: 40px; line-height: 1.6;">
                        <p style="font-size: 16px;">Hallo,</p>
                        <p style="font-size: 16px;">unsere KI hat deine energetischen Daten ausgewertet. Für das Sternzeichen <strong style="color: #e5904d;">${sternzeichen}</strong> haben wir eine besondere Resonanz gefunden:</p>
                        
                        <div style="background-color: #fdf6ec; border-left: 4px solid #e5904d; padding: 20px; margin: 30px 0;">
                            <h3 style="margin-top: 0; color: #e5904d;">Dein Ferien-Ziel: Harmonie & Kraft</h3>
                            <p><strong>Deine gewählten Parameter:</strong><br>
                            Sehnsucht: Level ${sehnsucht} | Aktivität: Level ${aktivitaet}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                            <p style="margin-bottom: 0;">Basierend auf diesen Werten empfehlen wir dir einen Ort, der Erdung bietet. Dein idealer Rückzugsort wartet in den <strong>sanften Hügeln der Toskana</strong> oder an den <strong>kraftvollen Küsten Portugals</strong>.</p>
                        </div>

                        <p style="font-size: 15px; color: #777; text-align: center;"><em>„Jede Reise beginnt mit dem ersten Schritt zu sich selbst.“</em></p>
                    </div>

                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                        <p>&copy; 2026 KI-Ferien.de | Dein Weg zur inneren Reise</p>
                    </div>
                </div>
            </div>
        `;

        // Versand via Resend API
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "KI-Analyse <info@ki-ferien.de>",
                to: emailUser,
                bcc: "mikostro@web.de", // Du bekommst immer eine Kopie
                subject: "🪷 Dein persönliches Ferien-Match",
                html: emailHtml,
            }),
        });

        if (response.ok) {
            // Erfolg: Weiterleitung zur Bestätigungsseite
            return {
                statusCode: 302,
                headers: { "Location": "/success.html" },
                body: "Redirecting..."
            };
        } else {
            const errorText = await response.text();
            console.error("Resend Error:", errorText);
            return { statusCode: 500, body: "E-Mail Versand fehlgeschlagen." };
        }

    } catch (error) {
        console.error("Funktions-Fehler:", error);
        return { statusCode: 500, body: error.message };
    }
};
