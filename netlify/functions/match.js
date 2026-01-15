exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        
        // Daten aus dem Formular extrahieren
        const sehnsucht = data.q_sehnsucht || "Nicht angegeben";
        const activity = data.q_activity || "Nicht angegeben";
        const age = data.q_age || "Nicht angegeben";
        const gender = data.q_gender || "Nicht angegeben";
        const zodiac = data.q_zodiac || "Nicht angegeben";
        const userEmail = data.email;

        // E-Mail Inhalt vorbereiten
        const emailHtml = `
            <h1>Neue Ferien-Analyse für ${userEmail}</h1>
            <p><strong>Sehnsucht (1-5):</strong> ${sehnsucht}</p>
            <p><strong>Aktivität (1-5):</strong> ${activity}</p>
            <p><strong>Alter:</strong> ${age}</p>
            <p><strong>Geschlecht:</strong> ${gender}</p>
            <p><strong>Sternzeichen:</strong> ${zodiac}</p>
            <hr>
            <p><em>Diese Anfrage wurde über ki-ferien.de gesendet.</em></p>
        `;

        // Versand via Resend API
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "KI-Ferien <onboarding@resend.dev>", // Später ändern auf info@ki-ferien.de
                to: "deine-email@beispiel.de", // DEINE Email hier eintragen für die Benachrichtigung
                subject: "Neue Seele-Match Analyse",
                html: emailHtml,
            }),
        });

        if (response.ok) {
            return {
                statusCode: 302,
                headers: { "Location": "/success.html" }, // Du brauchst eine success.html Seite
                body: "Erfolg",
            };
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 500, body: "Fehler beim Senden: " + error.message };
    }
};
