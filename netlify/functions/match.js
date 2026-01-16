const { Resend } = require('resend');

exports.handler = async (event) => {
    // 1. Initialisierung der Keys
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    try {
        // 2. Daten aus dem Formular empfangen
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');

        // Sternzeichen-Übersetzung
        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || "Reisender";

        // 3. KI-Analyse von Mistral (mit Name und Farbe)
        let kiAnalyse = "";
        try {
            const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: "mistral-tiny",
                    messages: [{
                        role: "user", 
                        content: `Du bist ein erfahrener Reise-Experte. Berücksichtige Hinweise des auswärtigen Amtes und Erstelle für ${vorname} eine persönliche Reise-Empfehlung für das aktuelle Jahr. 
                        Details: Sternzeichen ${zodiacDe}, Lieblingsfarbe ${farbe}. 
                        Anforderungen: Min. 3 Sätze, inspirierend, nenne das Sternzeichen korrekt (niemals Krabbe für Krebs nutzen) und beziehe die Farbe dezent ein.`
                    }]
                })
            });
            const kiData = await response.json();
            kiAnalyse = kiData.choices[0].message.content;
        } catch (kiErr) {
            console.error("Mistral Fehler:", kiErr);
            kiAnalyse = `Für dich als ${zodiacDe} stehen die Sterne auf Abenteuer! Deine Lieblingsfarbe ${farbe} wird dich auf deiner nächsten Reise begleiten.`;
        }

        // 4. E-Mail mit Resend versenden
        await resend.emails.send({
            from: 'KI-FERIEN Analyse <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Deine persönliche Reise-Inspiration, ${vorname}!`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                        <img src="https://ki-ferien.de/img/logo.png" alt="KI-FERIEN" style="width: 160px; height: auto;">
                    </div>
                    <div style="padding: 40px; line-height: 1.8; color: #333333; background-color: #ffffff;">
                        <h2 style="color: #1a2a3a; margin-top: 0;">Hallo ${vorname},</h2>
                        <p>wir haben die Sterne für dich befragt. Basierend auf deinem Sternzeichen <strong>${zodiacDe}</strong> und deiner Vorliebe für <strong>${farbe}</strong> haben wir folgende Inspiration für dich:</p>
                        
                        <div style="background: #f8fafc; padding: 25px; border-left: 4px solid #0056b3; font-style: italic; color: #2d3748; margin: 25px 0; border-radius: 4px;">
                            "${kiAnalyse}"
                        </div>
                        
                        <p>Bereit für dein nächstes Abenteuer?</p>
                        <p style="margin-top: 30px;">Herzliche Grüße,<br>Dein Team von <strong>ki-ferien.de</strong></p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        &copy; 2026 KI-FERIEN. Alle Rechte vorbehalten. <br>
                        <a href="https://ki-ferien.de" style="color: #0056b3; text-decoration: none;">Besuche uns für mehr Inspiration</a>
                    </div>
                </div>
            `
        });

        // 5. Erfolgsumleitung
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
        };

    } catch (error) {
        console.error("Gesamtfehler:", error);
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
