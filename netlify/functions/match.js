const { Resend } = require('resend');

exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

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

        // 1. KI-ANALYSE (Mistral)
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
                        content: `Du bist ein Reise-Astrologe. Erstelle für das Sternzeichen ${zodiacDe} eine inspirierende Reise-Empfehlung für das Jahr 2024. Max. 3 Sätze.`
                    }]
                })
            });
            const kiData = await response.json();
            kiAnalyse = kiData.choices[0].message.content;
        } catch (kiErr) {
            kiAnalyse = `Für ${zodiacDe} stehen die Sterne auf Abenteuer! Packe deine Koffer für eine Reise voller Überraschungen.`;
        }

        // 2. E-MAIL VERSAND (Resend)
        await resend.emails.send({
            from: 'KI-FERIEN Analyse <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Deine KI-Analyse für ${zodiacDe}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
                        <img src="https://ki-ferien.de/img/logo.png" alt="KI-FERIEN" style="width: 180px; height: auto;">
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #333;">
                        <h2 style="color: #2c3e50;">Hallo ${zodiacDe},</h2>
                        <p style="background: #f4f7f6; padding: 15px; border-left: 5px solid #0056b3; font-style: italic;">
                            "${kiAnalyse}"
                        </p>
                        <p>Genieße deinen Urlaub!</p>
                        <p>Beste Grüße,<br>Dein Team von <strong>ki-ferien.de</strong></p>
                    </div>
                </div>
            `
        });

        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
        };

    } catch (error) {
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
