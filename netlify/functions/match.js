exports.handler = async (event) => {
    // Nur POST-Anfragen erlauben
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };
    }

    try {
        // Die Daten kommen als URL-encoded Formular-Daten an
        const params = new URLSearchParams(event.body);
        const data = Object.fromEntries(params.entries());

        // Daten extrahieren (Namen müssen mit den 'name'-Attributen in deinem HTML übereinstimmen)
        const emailUser = data.email || "Keine E-Mail";
        const sehnsucht = data.q_sehnsucht || "3";
        const aktivitaet = data.q_activity || "3";
        const alter = data.q_age || "Nicht angegeben";
        const geschlecht = data.q_gender || "Nicht angegeben";
        const sternzeichen = data.q_zodiac || "Nicht angegeben";

        // E-Mail Inhalt für dich (Benachrichtigung)
        const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2 style="color: #e5904d;">Neue KI-Ferien Analyse</h2>
                <p>Eine neue Seele sucht ihr Match!</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>User E-Mail:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${emailUser}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sehnsucht (1-5):</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sehnsucht}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Aktivität (1-5):</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${aktivitaet}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Alter:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${alter}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Geschlecht:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${geschlecht}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sternzeichen:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${sternzeichen}</td></tr>
                </table>
                <br>
                <p style="font-size: 0.9em; color: #888;">Gesendet von deiner Zen-Garten Website.</p>
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
                from: "KI-Analyse <info@ki-ferien.de>", // Jetzt mit deiner verifizierten Domain!
                to: "DEINE_EIGENE_EMAIL@GMAIL.COM", // HIER DEINE EMAIL EINTRAGEN (wo die Ergebnisse landen sollen)
                subject: `Neue Analyse: ${sternzeichen} (${emailUser})`,
                html: emailHtml,
            }),
        });

        if (response.ok) {
            // Erfolg: Weiterleitung zur Bestätigungsseite
            return {
                statusCode: 302,
                headers: { "Location": "/success.html" },
                body: "Redirecting...",
            };
        } else {
            const errorData = await response.json();
            console.error("Resend Error:", errorData);
            throw new Error(JSON.stringify(errorData));
        }

    } catch (error) {
        console.error("Funktions-Fehler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Fehler beim Senden", details: error.message }),
        };
    }
};
