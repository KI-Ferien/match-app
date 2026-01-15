const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Daten aus dem Formular sicher auslesen
        const body = event.isBase64Encoded 
            ? Buffer.from(event.body, 'base64').toString() 
            : event.body;
        const data = Object.fromEntries(new URLSearchParams(body));

        const emailUser = data.email || "Keine E-Mail";
        const sternzeichen = data.q_zodiac || "Unbekannt";
        const alter = data.q_age || "??";

        const emailHtml = `
            <h2>Neue Analyse für ${emailUser}</h2>
            <p>Sternzeichen: ${sternzeichen}</p>
            <p>Alter: ${alter}</p>
            <p>Sehnsucht: ${data.q_sehnsucht}</p>
            <p>Aktivität: ${data.q_activity}</p>
        `;

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "KI-Analyse <info@ki-ferien.de>",
                to: "mikostro@web.de",
                subject: `KI-Match: ${sternzeichen}`,
                html: emailHtml,
            }),
        });

        if (response.ok) {
            return {
                statusCode: 302,
                headers: { "Location": "/success.html" },
                body: "Redirecting..."
            };
        } else {
            const err = await response.text();
            console.error("Resend Error:", err);
            return { statusCode: 500, body: err };
        }

    } catch (error) {
        console.error("Runtime Error:", error);
        return { statusCode: 500, body: error.message };
    }
};
