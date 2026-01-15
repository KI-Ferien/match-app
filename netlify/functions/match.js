const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
    // Falls kein POST-Request vorliegt
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = new URLSearchParams(event.body);
        
        // --- 1. DATEN-ÜBERSETZUNG (MAPPING) ---
        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        
        const intensityMap = {
            '1': 'Sanft & Ruhig',
            '2': 'Ausgeglichen',
            '3': 'Spürbar & Aktiv',
            '4': 'Stark & Intensiv',
            '5': 'Absolut Maximum'
        };

        const email = data.get('email');
        const zodiacDe = zodiacMap[data.get('q_zodiac')] || data.get('q_zodiac');
        const sehnsuchtDe = intensityMap[data.get('q_sehnsucht')] || "Individuell";
        const aktivitaetDe = intensityMap[data.get('q_aktivitaet')] || "Individuell";

        // --- 2. EMAIL-VERSAND ---
        // WICHTIG: 'from' erst ändern, wenn Domain verifiziert ist!
        await resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email,
            bcc: 'mikostro@web.de',
            subject: 'Deine KI-Ferien-Analyse ist bereit',
            html: `
                <div style="font-family: sans-serif; color: #4a4a4a; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #e5904d; margin: 0;">KI-FERIEN</h1>
                    </div>
                    
                    <p>Hallo,</p>
                    <p>unsere KI hat deine energetischen Daten ausgewertet. Für das Sternzeichen <strong>${zodiacDe}</strong> haben wir eine besondere Resonanz gefunden:</p>
                    
                    <div style="background-color: #fdf8f4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3e5d8;">
                        <h3 style="margin-top: 0; color: #8b5e3c;">Deine gewählten Parameter:</h3>
                        <p style="margin: 5px 0;"><strong>Sehnsucht:</strong> ${sehnsuchtDe}</p>
                        <p style="margin: 5px 0;"><strong>Aktivität:</strong> ${aktivitaetDe}</p>
                    </div>

                    <p style="font-style: italic; border-left: 4px solid #e5904d; padding-left: 15px; color: #777;">
                        "Jede Reise beginnt mit dem ersten Schritt zu sich selbst."
                    </p>

                    <p>Basierend auf diesen Werten empfehlen wir dir einen Ort, der Erdung bietet. Dein idealer Rückzugsort wartet in den <strong>sanften Hügeln der Toskana</strong> oder an den <strong>kraftvollen Küsten Portugals</strong>.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://ki-ferien.de" style="background-color: #e5904d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zurück zur Seite</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        © 2026 KI-Ferien.de | Dein Ziel auf dem Weg
                    </p>
                </div>
            `
        });

        // --- 3. ERFOLGS-ANTWORT (Weiterleitung) ---
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
        };

    } catch (error) {
        console.error("Error:", error);
        // Selbst bei Fehler zur Success-Seite, damit der User nicht hängt
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=mail' },
            body: ''
        };
    }
};
