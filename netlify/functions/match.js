const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Workflow: Mistral AI generates destination -> Robust Awin/TUI link creation -> Email via Resend.
 */
exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Affiliate Parameters
    const AWIN_ID = "2734466"; 
    const TUI_MID = "5123"; 

    try {
        const data = new URLSearchParams(event.body);
        const email = data.get('email');
        const vorname = data.get('vorname') || "Reisender";
        const farbe = data.get('farbe') || "bunt";
        const zodiacRaw = data.get('q_zodiac');

        // Mapping for display
        const zodiacMap = {
            'Widder': 'Widder', 'Stier': 'Stier', 'Zwillinge': 'Zwillinge', 
            'Krebs': 'Krebs', 'Löwe': 'Löwe', 'Jungfrau': 'Jungfrau',
            'Waage': 'Waage', 'Skorpion': 'Skorpion', 'Schütze': 'Schütze',
            'Steinbock': 'Steinbock', 'Wassermann': 'Wassermann', 'Fische': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || zodiacRaw || "Reisender";

        // 1. AI REQUEST (Mistral)
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
                    content: `Du bist ein Reise-Experte für KI-FERIEN. Wähle GENAU EIN perfektes Reiseziel für ${vorname} (Sternzeichen ${zodiacDe}, Lieblingsfarbe ${farbe}).
                    WICHTIG: Nenne nur ein Ziel, keine Liste! Schreibe keinen Einleitungstext.
                    Antworte STRIKT in diesem Format:
                    ZIEL: [Name des Ortes]
                    ANALYSE: [Begründung in maximal 2-3 Sätzen]`
                }]
            })
        });

        const kiData = await response.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        // Extraction logic
        const zielMatch = fullText.match(/ZIEL:\s*([^\n]*)/i);
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*?)(?=ZIEL:|$)/i);

        const zielName = zielMatch ? zielMatch[1].trim() : "Mittelmeer";
        const analyseText = analyseMatch ? analyseMatch[1].trim() : "Ein wunderbares Ziel für dich.";

        // 2. TUI AFFILIATE DEEPLINK (Robust Encoding)
        // This constructs the search URL on TUI.de
        const tuiSearchUrl = `https://www.tui.com/suchen/reisen?searchText=${encodeURIComponent(zielName)}`;
        
        // This wraps it into the Awin click tracker
        const affiliateLink = `https://www.awin1.com/cread.php?awinmid=${TUI_MID}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(tuiSearchUrl)}`;

        // 3. SEND EMAIL (Resend)
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de',
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: sans-serif;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                        <div style="padding: 40px; text-align: center; background-color: #eff6ff;">
                            <span style="text-transform: uppercase; letter-spacing: 2px; font-size: 10px; color: #2563eb; font-weight: bold;">KI-Berechnung abgeschlossen</span>
                            <h1 style="color: #1e293b; margin: 10px 0 0 0; font-size: 24px;">Dein persönliches Match!</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p style="color: #64748b; font-size: 14px;">Hallo ${vorname},</p>
                            <p style="color: #334155;">Basierend auf deiner astrologischen Konstellation haben wir ein Ziel gefunden, das perfekt zu dir passt:</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <h2 style="color: #2563eb; font-size: 32px; margin: 0;">${zielName}</h2>
                            </div>

                            <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 4px solid #2563eb; color: #1e3a8a; font-style: italic; line-height: 1.5;">
                                "${analyseText}"
                            </div>

                            <div style="text-align: center; margin-top: 40px;">
                                <a href="${affiliateLink}" style="background-color: #d40e14; color: #ffffff; padding: 20px 35px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 16px; display: inline-block;">
                                    Angebote für ${zielName} bei TUI prüfen
                                </a>
                            </div>
                        </div>
                        <div style="padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; background: #fafafa;">
                            &copy; 2026 KI-FERIEN. Empfehlungen basieren auf KI-Analysen.<br>
                            Der Button führt direkt zur TUI Buchungsseite.
                        </div>
                    </div>
                </div>
            `
        });

        // Redirect to success page
        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
