const { Resend } = require('resend');

/**
 * Hilfsfunktion: NUR für Travelpayouts-Links (Booking, etc.)
 */
async function createTravelpayoutsLink(targetUrl) {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) return targetUrl;

    try {
        const response = await fetch('https://api.travelpayouts.com/links/v1/create', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-Access-Token': token 
            },
            body: JSON.stringify({
                "trs": 492044,
                "marker": 698672,
                "shorten": true,
                "links": [{ "url": targetUrl }]
            })
        });
        const data = await response.json();
        if (data && data.result && data.result.links[0]) {
            return data.result.links[0].partner_url;
        }
        return targetUrl;
    } catch (e) {
        return targetUrl;
    }
}

exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Dein Awin TUI-Link (bleibt statisch, da Awin)
    const tuiAwinLink = "https://www.awin1.com/cread.php?awinmid=12531&awinaffid=2734466&ued=https%3A%2F%2Fwww.tui.com";

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Reisender";
        const hobbys = params.get('hobbys') || "Entdeckung";

        // 1. KI-Anfrage (Mistral)
        const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [{
                    role: "user", 
                    content: `Wähle ein Urlaubsziel für ${vorname} (Hobbys: ${hobbys}). Antworte STRENG: ZIEL: [Ort] ANALYSE: [Grund]`
                }]
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielMatch = fullText.match(/ZIEL:\s*([^\n]*)/i);
        const zielName = zielMatch ? zielMatch[1].trim() : "Mittelmeer";
        const analyseMatch = fullText.match(/ANALYSE:\s*([\s\S]*?)(?=ZIEL:|$)/i);
        const analyseText = analyseMatch ? analyseMatch[1].trim() : "Ein wunderbarer Ort für dich.";

        // 2. LINKS GENERIEREN
        // Dieser Link geht über Travelpayouts (z.B. Booking)
        const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(zielName)}`;
        const dynamicTravelLink = await createTravelpayoutsLink(bookingUrl);

        // 3. E-MAIL VERSAND (Resend)
        const today = new Date().toISOString().split('T')[0];
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 24px; border: 1px solid #eee; overflow: hidden;">
                    <div style="background: #eff6ff; padding: 40px; text-align: center;">
                        <h1 style="color: #1e293b;">Hallo ${vorname}, dein Match ist da!</h1>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <h2 style="color: #2563eb; font-size: 32px;">${zielName}</h2>
                        <p style="font-style: italic; color: #1e3a8a; background: #f8fafc; padding: 20px; border-radius: 12px;">"${analyseText}"</p>
                        
                        <div style="margin-top: 30px;">
                            <a href="${dynamicTravelLink}" style="background: #2563eb; color: white; padding: 18px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: block; margin-bottom: 15px;">
                                Hotels in ${zielName} finden
                            </a>
                            
                            <a href="${tuiAwinLink}" style="background: #d40e14; color: white; padding: 18px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: block;">
                                Ferien-Angebote bei TUI prüfen
                            </a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 10px; color: #94a3b8;">
                        &copy; 2026 KI-FERIEN. Enthält Partner-Links von Travelpayouts & TUI (Awin).
                    </div>
                </div>
            `
        }, { idempotencyKey });

        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' }, body: '' };
    }
};
