const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const zodiacRaw = data.get('q_zodiac');

        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || "Reisender";

        // E-Mail wird "gefeuert", aber wir warten nicht auf die Antwort (kein await)
        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            bcc: 'mikostro@web.de', // Deine Kopie
            subject: 'Deine KI-Ferien-Analyse ist fertig!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; text-align: center; border: 1px solid #eee; padding: 20px;">
                    <img src="https://ki-ferien.de/img/logo.png" alt="KI-FERIEN" style="width: 180px; height: auto; margin-bottom: 20px;">
                    <h2 style="color: #333;">Hallo für das Sternzeichen ${zodiacDe}!</h2>
                    <p>Deine KI-Analyse ist bereit. Wir berechnen gerade die besten Reiseziele für dich.</p>
                    <p>Schau bald wieder auf <a href="https://ki-ferien.de">ki-ferien.de</a> vorbei für mehr Updates!</p>
                </div>
            `
        }).catch(err => console.error("Resend Error:", err));

        // Sofortiger Redirect
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
        };

    } catch (error) {
        console.error("Fehler:", error);
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
