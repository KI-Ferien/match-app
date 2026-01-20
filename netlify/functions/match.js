const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Fix: Korrekte Awin Deeplink-Struktur zur Vermeidung von 1x1 Pixel Fehlern.
 */
exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Affiliate Parameter
    const AWIN_ID = "2734466"; 
    const TUI_MID = "5123"; 

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');

        // Mapping für Anzeige
        const zodiacMap = {
            'Widder': 'Widder', 'Stier': 'Stier', 'Zwillinge': 'Zwillinge', 
            'Krebs': 'Krebs', 'Löwe': 'Löwe', 'Jungfrau': 'Jungfrau',
            'Waage': 'Waage', 'Skorpion': 'Skorpion', 'Schütze': 'Schütze',
            'Steinbock': 'Steinbock', 'Wassermann': 'Wassermann', 'Fische': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || zodiacRaw || "Reisender";

        // 1. KI-ANFRAGE
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
                    content: `Du bist ein Reise-Experte für KI-FERIEN. Erstelle für ${vorname} (Sternzeichen ${zodiacDe}, Farbe ${farbe}) ein persönliches Ferien-Match.
                    Antworte strikt in diesem Format:
                    ZIEL: [Name eines konkreten Urlaubsortes oder einer Region]
                    ANALYSE: [Begründung in max. 3 Sätzen]`
                }]
            })
        });

        const kiData = await response.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        const zielMatch = fullText.match(/ZIEL:\s*(.*)/i);
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*)/i);

        const zielName = zielMatch ? zielMatch[1].trim() : "Mittelmeer";
        const analyseText = analyseMatch ? analyseMatch[1].trim() : "Ein wunderbares Ziel für dich.";

        // 2. TUI AFFILIATE DEEPLINK (FIX FÜR 1x1 PIXEL PROBLEM)
        // Wir bauen die TUI Suche und hängen sie an den Awin-Link
        const tuiSearchUrl = `https://www.tui.com/suchen/reisen?searchText=${encodeURIComponent(zielName)}`;
        
        // WICHTIG: Der Parameter 'ued' muss die komplette Ziel-URL enthalten. 
        // Bei Awin1 cread.php ist dies die Standard-Struktur.
        const affiliateLink = `https://www.awin1.com/cread.php?awinmid=${TUI_MID}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(tuiSearchUrl)}`;

        // 3. E-MAIL VERSAND
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: sans-serif;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden;">
                        <div style="padding: 40px; text-align: center; background-color: #eff6ff;">
                            <h1 style="color: #1e293b; margin: 0;">Dein KI-Match ist da!</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p>Hallo ${vorname},</p>
                            <p>Dein Ziel ist:</p>
                            <h2 style="color: #2563eb; font-size: 28px;">${zielName}</h2>
                            <p style="font-style: italic; background: #f8fafc; padding: 20px; border-radius: 12px;">"${analyseText}"</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${affiliateLink}" style="background-color: #d40e14; color: #ffffff; padding: 18px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                                    Angebote für ${zielName} bei TUI prüfen
                                </a>
                            </div>
                        </div>
                        <div style="padding: 20px; text-align: center; font-size: 10px; color: #94a3b8;">
                            &copy; 2026 KI-FERIEN. Affiliate-Links führen zu TUI.de.
                        </div>
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
