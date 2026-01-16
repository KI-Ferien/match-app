const { Resend } = require('resend');

exports.handler = async (event) => {
    // 1. Log: Startet die Funktion überhaupt?
    console.log("Funktion gestartet mit Methode:", event.httpMethod);

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        
        console.log("Versuche Mail zu senden an:", email);

        // Wir nutzen hier EINE einzige Zeile 'await', um zu sehen, ob Resend antwortet
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'KI-Ferien Test',
            html: '<p>Test erfolgreich!</p>'
        });

        console.log("Resend Antwort:", JSON.stringify(response));

        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
        };

    } catch (error) {
        console.error("KRITISCHER FEHLER:", error.message);
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=' + encodeURIComponent(error.message) },
            body: ''
        };
    }
};
