const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Workflow: Mistral AI generiert Ziel -> Statischer Awin Banner Link -> E-Mail Versand.
 * Fix: Verwendung des statischen Awin-Werbemittels zur Vermeidung von Redirect-Problemen.
 */
exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Statischer Awin-Link aus deinem Werbemittel
    // Hinweis: Dieser Link führt zur TUI-Startseite mit deinem Tracking
    const staticAffiliateLink = "https://www.awin1.com/cread.php?s=2902233&v=10102&q=415156&r=2734466";

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');

        const zodiacMap = {
            'Widder': 'Widder', 'Stier': 'Stier', 'Zwillinge': 'Zwillinge', 
            'Krebs': 'Krebs', 'Löwe': 'Löwe', 'Jungfrau': 'Jungfrau',
            'Waage': 'Waage', 'Skorpion': 'Skorpion', 'Schütze': 'Schütze',
            'Steinbock': 'Steinbock', 'Wassermann': 'Wassermann', 'Fische': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || zodiacRaw || "Reisender";

        // 1. KI ANFRAGE
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
                    content: `Du bist ein Reise-Experte. Wähle GENAU EIN Urlaubsziel für ${vorname} (Sternzeichen ${zodiacDe}, Farbe ${farbe}).
                    Antworte nur im Format:
                    ZIEL: [Ort]
                    ANALYSE: [Max 2 Sätze]`
                }]
            })
        });

        const kiData = await response.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        const zielMatch = fullText.match(/ZIEL:\s*([^\n]*)/i);
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*?)(?=ZIEL:|$)/i);

        const zielName = zielMatch ? zielMatch[1].trim() : "Mittelmeer";
        const analyseText = analyseMatch ? analyseMatch[1].trim() : "Dein perfektes Match.";

        // 2. E-MAIL VERSAND
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
                    <div style="background: #eff6ff; padding: 30px; text-align: center;">
                        <h1 style="color: #1e293b; font-size: 22px;">Dein KI-Match ist da!</h1>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <p>Hallo ${vorname}, dein Ziel ist:</p>
                        <h2 style="color: #2563eb; font-size: 32px;">${zielName}</h2>
                        <p style="background: #f8fafc; padding: 20px; border-radius: 10px; font-style: italic;">"${analyseText}"</p>
                        
                        <div style="margin-top: 35px;">
                            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Klicke hier, um Angebote für dein Match auf TUI.com zu finden:</p>
                            <a href="${staticAffiliateLink}" target="_blank" style="background: #d40e14; color: white; padding: 20px 40px; text-decoration: none; border-radius: 15px; font-weight: bold; display: inline-block;">
                                Jetzt bei TUI suchen
                            </a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 10px; color: #94a3b8;">
                        &copy; 2026 KI-FERIEN. Offizieller TUI Partner.<br>
                        Der Link führt zur TUI-Startseite.
                    </div>
                </div>
            `
        });

        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
