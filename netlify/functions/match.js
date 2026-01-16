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

        // --- 2. EMAIL-VERSAND (Hintergrund-Modus) ---
        // Wir nehmen das 'await' weg, damit der User nicht warten muss
        resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email,
            bcc: 'mikostro@web.de',
            subject: 'Deine KI-Ferien-Analyse ist bereit',
            html: `
                <div style="font-family: 'Helvetica', Arial, sans-serif; color: #4a4a4a; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 40px; line-height: 1.6; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 28px; font-weight: bold; color: #e5904d; letter-spacing: 2px;">KI-FERIEN</div>
                        <div style="font-size: 12px; color: #8b5e3c; text-transform: uppercase;">Dein Ziel auf dem Weg</div>
                    </div>
                    
                    <p>Hallo,</p>
                    <p>unsere KI hat deine energetischen Daten ausgewertet. Für das Sternzeichen <strong>${zodiacDe}</strong> haben wir eine besondere Resonanz gefunden:</p>
                    
                    <div style="background-color: #fdf8f4; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #f3e5d8;">
                        <h3 style="margin-top: 0; color: #8b5e3c; font-size: 16px;">Deine gewählten Parameter:</h3>
                        <p style="margin: 5px 0;"><strong>Sehnsucht:</strong> ${sehnsuchtDe}</p>
                        <p style="margin: 5px 0;"><strong>Aktivität:</strong> ${aktivitaetDe}</p>
                    </div>

                    <p style="font-style: italic; border-left: 4px solid #e5904d; padding-left: 15px; color: #777; margin: 25px 0;">
                        "Jede Reise beginnt mit dem ersten Schritt zu sich selbst."
                    </p>

                    <p>Basierend auf diesen Werten empfehlen wir dir einen Ort, der Erdung bietet. Dein idealer Rückzugsort wartet in den <strong>sanften Hügeln der Toskana</strong> oder an den <strong>kraftvollen Küsten Portugals</strong>.</p>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://ki-ferien.de" style="background-color: #e5904d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Zurück zur Reiseplanung</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;">
                    <p style="font-size: 11px; color: #aaa; text-align: center; letter-spacing: 1px;">
                        © 2026 KI-FERIEN.DE
                    </p>
                </div>
            `
        }).catch(err => console.error("Email Error:", err));

        // --- 3. SOFORTIGE ANTWORT ---
        return {
            statusCode: 302,
            headers: { 
                'Location': '/success.html',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
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
