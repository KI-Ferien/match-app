const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Workflow: Mistral AI generiert personalisiertes Reiseziel -> Affiliate Link wird erstellt -> Resend E-Mail Versand.
 */
exports.handler = async (event) => {
    // API Keys aus Umgebungsvariablen
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

        const zodiacMap = {
            'aries': 'Widder', 'taurus': 'Stier', 'gemini': 'Zwillinge', 
            'cancer': 'Krebs', 'leo': 'Löwe', 'virgo': 'Jungfrau',
            'libra': 'Waage', 'scorpio': 'Skorpion', 'sagittarius': 'Schütze',
            'capricorn': 'Steinbock', 'aquarius': 'Wassermann', 'pisces': 'Fische'
        };
        const zodiacDe = zodiacMap[zodiacRaw] || "Reisender";

        // 1. KI-ANFRAGE AN MISTRAL AI (Analyse & Ziel-Extraktion)
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
                    content: `Du bist eine Reise-Expertin für KI-FERIEN. Erstelle für ${vorname} (Sternzeichen ${zodiacDe}, Farbe ${farbe}) ein persönliches Ferien-Match.
                    Antworte strikt in diesem Format:
                    ZIEL: [Name eines konkreten Urlaubsortes oder einer Region]
                    ANALYSE: [Inspirierende Begründung, warum dies das perfekte Ferien-Match ist, in max. 4 Sätzen]`
                }]
            })
        });

        const kiData = await response.json();
        const fullText = kiData.choices[0].message.content;

        // Zerlegen der KI-Antwort
        const zielMatch = fullText.match(/ZIEL:\s*(.*)/i);
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*)/i);

        const zielName = zielMatch ? zielMatch[1].trim() : "Dein Traumziel";
        const analyseText = analyseMatch ? analyseMatch[1].trim() : fullText;

        // 2. TUI AFFILIATE DEEPLINK ERSTELLUNG
        const tuiBaseUrl = `https://www.tui.com/suchen/reisen?searchText=${encodeURIComponent(zielName)}`;
        const affiliateLink = `https://www.awin1.com/cread.php?awinmid=${TUI_MID}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(tuiBaseUrl)}`;

        // 3. E-MAIL VERSAND ÜBER RESEND
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', // Kopie für dich zur Kontrolle
            subject: `Dein Ferien-Match für ${zielName} 🌴`,
            html: `
                <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        
                        <div style="padding: 40px; text-align: center; background-color: #eff6ff;">
                            <span style="letter-spacing: 3px; text-transform: uppercase; font-size: 11px; color: #2563eb; font-weight: 900;">KI-FERIEN</span>
                            <h1 style="color: #1e293b; font-size: 26px; margin-top: 15px; font-weight: 800;">Dein Ferien-Match ist bereit!</h1>
                        </div>

                        <div style="padding: 40px; color: #334155; line-height: 1.6; font-size: 16px;">
                            <p>Hallo ${vorname},</p>
                            <p>basierend auf deinem Sternzeichen <strong>${zodiacDe}</strong> und deiner Lieblingsfarbe <strong>${farbe}</strong> haben wir dein perfektes Ziel gefunden:</p>
                            
                            <h2 style="color: #2563eb; font-size: 32px; text-align: center; margin: 30px 0; font-weight: 800;">${zielName}</h2>

                            <div style="margin: 20px 0; padding: 25px; border-radius: 16px; background-color: #f8fafc; border: 1px solid #f1f5f9; font-style: italic; color: #1e3a8a;">
                                "${analyseText.replace(/\n/g, '<br>')}"
                            </div>

                            <div style="text-align: center; margin-top: 40px;">
                                <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">Klicke hier für aktuelle Angebote bei TUI für ${zielName}:</p>
                                <a href="${affiliateLink}" style="background-color: #d40e14; color: #ffffff; padding: 22px 45px; text-decoration: none; border-radius: 18px; font-size: 18px; font-weight: 800; display: inline-block;">
                                    Jetzt bei TUI ansehen
                                </a>
                            </div>
                        </div>

                        <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                            &copy; 2026 KI-FERIEN – Intelligente Urlaubsplanung.<br>
                            Affiliate-Angebote werden bereitgestellt von TUI Deutschland.
                        </div>
                    </div>
                </div>
            `
        });

        // Erfolgreiche Weiterleitung
        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Funktions-Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
