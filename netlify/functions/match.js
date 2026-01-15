const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
    try {
        // 1. Daten aus dem Formular holen
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const zodiac = data.get('q_zodiac');

        // 2. E-Mail senden
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Später durch deine Domain ersetzen
            to: email,
            bcc: 'mikostro@web.de',
            subject: 'Deine KI-Ferien-Analyse ist fertig!',
            html: `<h1>Deine Analyse</h1><p>Dein Sternzeichen: ${zodiac}</p>`
        });

        // 3. ERFOLG: Weiterleitung erzwingen
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: '' 
        };

    } catch (error) {
        console.error("Fehler in der Function:", error);
        // Auch bei Fehler weiterleiten oder eine Nachricht zeigen
        return {
            statusCode: 200,
            body: `Fehler: ${error.message}. Bitte prüfe, ob der RESEND_API_KEY in Netlify hinterlegt ist.`
        };
    }
};
