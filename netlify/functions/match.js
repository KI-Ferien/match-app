const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = new URLSearchParams(event.body);
        
        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        
        const intensityMap = {
            '1': 'Sanft & Ruhig', '2': 'Ausgeglichen', '3': 'Spürbar & Aktiv',
            '4': 'Stark & Intensiv', '5': 'Absolut Maximum'
        };

        const email = data.get('email');
        const zodiacDe = zodiacMap[data.get('q_zodiac')] || data.get('q_zodiac');
        const sehnsuchtDe = intensityMap[data.get('q_sehnsucht')] || "Individuell";
        const aktivitaetDe = intensityMap[data.get('q_aktivitaet')] || "Individuell";

        // --- EMAIL-VERSAND (Hintergrund-Modus für Speed) ---
        resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email,
            bcc: 'mikostro@web.de',
            subject: 'Deine KI-Ferien-Analyse ist bereit',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #4a4a4a; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 0; background-color: #ffffff;">
                    <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #f9f9f9;">
                        <img src="https://ki-ferien.de/logo.png" alt="KI-FERIEN" style="width: 220px; height: auto; display: block; margin: 0 auto;">
                    </div>
                    
                    <div style="padding: 40px;">
                        <h2 style="color: #e5904d; font-weight: 300; margin-top: 0;">Hallo,</h2>
                        <p>unsere KI hat deine energetischen Daten ausgewertet. Für das Sternzeichen <strong>${zodiacDe}</strong> haben wir eine besondere Resonanz gefunden:</p>
                        
                        <div style="background-color: #fdf8f4; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f3e5d8;">
                            <h3 style="margin-top: 0; color: #8b5e3c; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Deine Analyse-Werte:</h3>
                            <p style="margin: 10px 0; font-size: 16px;"><strong>Sehnsucht:</strong> ${sehnsuchtDe}</p>
                            <p style="margin: 10px 0; font-size: 16px;"><strong>Aktivität:</strong> ${aktivitaetDe}</p>
                        </div>

                        <p style="font-style: italic; border-left: 4px solid #e5904d; padding-left: 20px; color: #777; margin: 30px 0; font-size: 17px;">
                            "Jede Reise beginnt mit dem ersten Schritt zu sich selbst."
                        </p>

                        <p>Dein idealer Rückzugsort wartet in den <strong>sanften Hügeln der Toskana</strong> oder an den <strong>kraftvollen Küsten Portugals</strong>. Diese Orte harmonieren perfekt mit deiner aktuellen Energie.</p>
                        
                        <div style="text-align: center; margin-top: 50px;">
                            <a href="https://ki-ferien.de" style="background-color: #e5904d; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Neue Analyse starten</a>
                        </div>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 30px; text-align: center;">
                        <p style="font-size: 11px; color: #aaa; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                            © 2026 KI-FERIEN.DE | DEIN ZIEL AUF DEM WEG
                        </p>
                    </div>
                </div>
            `
        }).catch(err => console.error("Email Error:", err));

        // --- SOFORTIGE WEITERLEITUNG (Kein Warten mehr!) ---
        return {
            statusCode: 302,
            headers: { 
                'Location': '/success.html',
                'Cache-Control': 'no-cache'
            },
            body: ''
        };

    } catch (error) {
        console.error("General Error:", error);
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
