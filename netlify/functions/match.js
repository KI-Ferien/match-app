const { Resend } = require('resend');

/**
 * Hilfsfunktion: Travelpayouts Link-Erstellung (Booking etc.)
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
        return (data?.result?.links?.[0]?.partner_url) || targetUrl;
    } catch (e) {
        return targetUrl;
    }
}

exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // KORREKTUR: Dein direkter TUI-Awin Link
    // Falls "This link is inactive" kommt, prüfe bitte in Awin, ob die Kampagne noch aktiv ist.
    const tuiAwinLink = "https://www.awin1.com/cread.php?awinmid=12531&awinaffid=2734466&ued=https%3A%2F%2Fwww.tui.com";

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        if (!email) throw new Error("Keine E-Mail-Adresse gefunden");

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
                    content: `Wähle ein Urlaubsziel für ${vorname} (Hobbys: ${hobbys}). Antworte nur: ZIEL: [Ort] ANALYSE: [Grund]`
                }]
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)(?=ZIEL:|$)/i)?.[1]?.trim() || "Ein tolles Ziel für dich!";

        // 2. Travelpayouts Link für das dynamische Ziel
        const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(zielName)}`;
        const dynamicTravelLink = await createTravelpayoutsLink(bookingUrl);

        // 3. E-Mail Versand mit Idempotency
        const today = new Date().toISOString().split('T')[0];
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
                    <div style="background: #eff6ff; padding: 30px; text-align: center;">
                        <h1 style="margin:0;">Hallo ${vorname}!</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <h2 style="color: #2563eb;">${zielName}</h2>
                        <p style="background: #f8fafc; padding: 15px; border-radius: 10px;">${analyseText}</p>
                        <div style="margin-top: 25px;">
                            <a href="${dynamicTravelLink}" style="background: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; display: block; margin-bottom: 10px; font-weight: bold;">Hotels in ${zielName} (Booking)</a>
                            <a href="${tuiAwinLink}" style="background: #d40e14; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; display: block; font-weight: bold;">Angebote bei TUI prüfen</a>
                        </div>
                    </div>
                </div>`
        }, { idempotencyKey });

        // 4. ERFOLGREICHER ABSCHLUSS & WEITERLEITUNG
        return {
            statusCode: 302,
            headers: { 
                'Location': '/success.html',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ status: "success" })
        };

    } catch (error) {
        console.error("Fehler:", error);
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html?error=true' },
            body: ''
        };
    }
};
