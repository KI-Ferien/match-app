const { Resend } = require('resend');

exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');

        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || "Reisender";

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
                        content: `Du bist ein Reise-Experte. Erstelle für ${vorname} eine persönliche Reise-Inspiration. 
                        Details: Sternzeichen ${zodiacDe}, Lieblingsfarbe ${farbe}. 
                        Anforderungen: Max. 5 Sätze, inspirierend, nenne das Sternzeichen korrekt und beziehe die Farbe dezent ein. Antworte nur mit der Analyse.`
                    }]
                })
            });
            const kiData = await response.json();
            kiAnalyse = kiData.choices[0].message.content;
        } catch (kiErr) {
            kiAnalyse = `Für dich als ${zodiacDe} stehen die Sterne auf Erholung. Deine Farbe ${farbe} wird dich zu deinem nächsten Seelenort begleiten.`;
        }

        // HTML-Umbrüche für die E-Mail vorbereiten
        const formattedAnalyse = kiAnalyse.replace(/\n/g, '<br>');

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Deine Seelenort-Analyse, ${vorname}`,
            html: `
                <div style="background-color: #f9f7f4; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                        
                        <div style="padding: 40px 40px 20px 40px; text-align: center;">
                            <span style="letter-spacing: 5px; text-transform: uppercase; font-size: 14px; color: #a8a29e;">KI-Ferien</span>
                            <h1 style="color: #44403c; font-weight: 300; font-size: 26px; margin-top: 20px;">Deine Analyse ist bereit</h1>
                        </div>

                        <div style="padding: 0 40px 40px 40px; color: #57534e; line-height: 1.8; font-size: 16px;">
                            <p>Hallo ${vorname},</p>
                            <p>wir haben die Sterne und die Farben befragt. Für dich als <strong>${zodiacDe}</strong> haben wir diese Inspiration empfangen:</p>
                            
                            <div style="margin: 30px 0; padding: 25px; border-left: 2px solid #d6d3d1; background-color: #fafaf9; font-style: italic; color: #44403c;">
                                "${formattedAnalyse}"
                            </div>

                            <p>Möge dieser Ort dir die Ruhe schenken, nach der du suchst.</p>
                            
                            <div style="text-align: center; margin-top: 40px;">
                                <a href="https://ki-ferien.de" style="background-color: #78716c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 15px; display: inline-block;">Zurück zur Website</a>
                            </div>
                        </div>

                        <div style="background-color: #fafaf9; padding: 30px; text-align: center; font-size: 12px; color: #a8a29e; border-top: 1px solid #f5f5f4;">
                            &copy; 2026 KI-FERIEN – Dein Seelenort.<br>
                            <p style="margin-top: 10px; font-size: 10px; line-height: 1.4;">
                                Du hast diese E-Mail angefordert auf ki-ferien.de.<br>
                                Reisehinweise des Auswärtigen Amtes beachten.
                            </p>
                        </div>
                    </div>
                </div>
            `
        });

        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Gesamtfehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
