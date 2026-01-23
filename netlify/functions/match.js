const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Workflow: Mistral AI generiert Ziel basierend auf Hobbys -> Statischer Awin Banner Link -> E-Mail Versand via Resend.
 */
exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Dein statischer Awin-Link (TUI Startseite) mit deinem Tracking r=2734466
    const staticAffiliateLink = "https://ki-ferien.de/?go=tui";

    try {
        // Daten aus dem Formular extrahieren
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');
        const hobbys = data.get('hobbys') || "Entspannung und Entdeckung";

        const zodiacMap = {
            'Widder': 'Widder', 'Stier': 'Stier', 'Zwillinge': 'Zwillinge', 
            'Krebs': 'Krebs', 'Löwe': 'Löwe', 'Jungfrau': 'Jungfrau',
            'Waage': 'Waage', 'Skorpion': 'Skorpion', 'Schütze': 'Schütze',
            'Steinbock': 'Steinbock', 'Wassermann': 'Wassermann', 'Fische': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || zodiacRaw || "Reisender";

        // 1. KI ANFRAGE an Mistral AI
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
                    content: `Du bist ein erfahrener Reise-Experte. Wähle GENAU EIN ideales Urlaubsziel für ${vorname}.
                    Persönliche Details: Sternzeichen ${zodiacDe}, Lieblingsfarbe ${farbe}, Interessen/Hobbys: ${hobbys}.
                    Berücksichtige besonders die genannten Sportarten oder Hobbys bei der Wahl des Ziels.
                    Antworte STRENG im folgenden Format:
                    ZIEL: [Name des Ortes]
                    ANALYSE: [Begründung in maximal 2 Sätzen, warum dieser Ort perfekt für diese Hobbys und dieses Sternzeichen ist]`
                }]
            })
        });

        const kiData = await response.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        // Ziel und Analyse extrahieren
        const zielMatch = fullText.match(/ZIEL:\s*([^\n]*)/i);
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*?)(?=ZIEL:|$)/i);

        const zielName = zielMatch ? zielMatch[1].trim() : "Mittelmeer";
        const analyseText = analyseMatch ? analyseMatch[1].trim() : "Dieses Ziel passt wunderbar zu deinen individuellen Interessen.";

        // 2. E-MAIL VERSAND via Resend
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', // Deine Kopie zur Kontrolle
            subject: `Dein Ferien-Match für ${hobbys}: ${zielName} 🌴`,
            html: `
                <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <div style="background: #eff6ff; padding: 40px; text-align: center;">
                        <span style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px; color: #2563eb; font-weight: bold;">Analyse abgeschlossen</span>
                        <h1 style="color: #1e293b; font-size: 26px; margin: 10px 0 0 0;">Hallo ${vorname}, hier ist dein Match!</h1>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <p style="color: #64748b; margin-bottom: 5px;">Basierend auf deinen Interessen für <b>${hobbys}</b> empfehlen wir:</p>
                        <h2 style="color: #2563eb; font-size: 36px; margin: 10px 0;">${zielName}</h2>
                        
                        <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 4px solid #2563eb; color: #1e3a8a; font-style: italic; line-height: 1.6; text-align: left; margin: 30px 0;">
                            "${analyseText}"
                        </div>
                        
                        <div style="margin-top: 40px;">
                            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Finde jetzt die besten Angebote für ${zielName} auf TUI.com:</p>
                            <a href="${staticAffiliateLink}" target="_blank" style="background: #d40e14; color: white; padding: 20px 40px; text-decoration: none; border-radius: 16px; font-weight: bold; font-size: 18px; display: inline-block;">
                                Jetzt bei TUI entdecken
                            </a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 10px; color: #94a3b8; border-top: 1px solid #eee;">
                        &copy; 2026 KI-FERIEN. Deine Hobbys standen im Mittelpunkt unserer Analyse.<br>
                        Dieser Link führt zur TUI-Startseite (Affiliate-Tracking aktiv).
                    </div>
                </div>
            `
        });

        // 3. ERFOLGS-WEITERLEITUNG
        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
