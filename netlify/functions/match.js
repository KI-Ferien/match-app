const { Resend } = require('resend');

async function askMistral(prompt) {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
            model: "mistral-tiny",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Nur POST erlaubt" };

    try {
        const { email, zodiacs, vibe, budget, style } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const zodiacNames = zodiacs.map(z => z.charAt(0).toUpperCase() + z.slice(1)).join(' & ');
        const pronPoss = zodiacs.length > 1 ? "eure" : "deine";

        const prompt = `
            Du bist der Reise-Astrologe von KI-FERIEN.DE. 
            Analysiere: Sternzeichen ${zodiacNames}, Vibe ${vibe}%, Budget ${budget}, Stil ${style}.
            Wähle ein Ziel weltweit (nur Stadt oder Insel).
            ANTWORTE STRIKT SO:
            ZIEL: [Name des Ziels]
            TEXT: [Begründung, max 3 Sätze, nutze Ferien statt Urlaub]
        `;

        const aiResponse = await askMistral(prompt);
        
        // --- REINIGUNG: Keine Klammern oder Sonderzeichen im Ziel ---
        let rawDest = aiResponse.split('ZIEL:')[1].split('TEXT:')[0].trim();
        const destination = rawDest.replace(/\([^)]*\)/g, "").replace(/\*|\n|\r/g, "").trim();
        
        const reasoningText = aiResponse.split('TEXT:')[1].trim();
        const base = "https://ki-ferien.de/buchen";
        const encDest = encodeURIComponent(destination);

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #02050a; color: #ffffff; padding: 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0a1e3b; border-radius: 16px; overflow: hidden; border: 1px solid #0096ff;">
                <div style="background-color: #0096ff; padding: 40px 20px;">
                    <h1 style="margin: 0; color: #ffcc00; letter-spacing: 4px; font-size: 20px;">KI-FERIEN.DE</h1>
                </div>
                <div style="padding: 30px 20px; text-align: left; color: #e0e0e0;">
                    <p>Hallo,</p>
                    <p>Die Sterne weisen den Weg nach: <strong style="color: #ffcc00; font-size: 20px;">${destination}</strong></p>
                    <div style="background-color: #051329; border-radius: 12px; padding: 15px; margin: 20px 0; border-left: 4px solid #ffcc00;">
                        <p style="font-size: 14px; margin: 0;">${reasoningText}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="${base}?typ=flug&ziel=${encDest}" style="display: block; margin: 10px 0; padding: 15px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">✈️ Flüge prüfen</a>
                        <a href="${base}?typ=erlebnis&ziel=${encDest}" style="display: block; margin: 10px 0; padding: 15px; background: #0096ff; color: white; text-decoration: none; border-radius: 50px; font-weight: bold;">🏨 Unterkünfte & Erlebnisse</a>
                        <a href="${base}?typ=transfer&ziel=${encDest}" style="display: block; margin: 10px 0; padding: 12px; border: 1px solid #444; color: #aaa; text-decoration: none; border-radius: 50px; font-size: 13px;">🚗 Privat-Transfer buchen</a>
                    </div>
                </div>
            </div>
        </div>`;

        await resend.emails.send({
            from: 'KI-Ferien Analyse <info@ki-ferien.de>', 
            to: email,
            subject: `✨ ${pronPoss.charAt(0).toUpperCase() + pronPoss.slice(1)} Ziel: ${destination}`,
            html: htmlContent
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, destination })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
