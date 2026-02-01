const { Resend } = require('resend');

/**
 * Erzeugt einen Affiliate-Link über die Travelpayouts API v1
 */
async function generateAffiliateLink(targetUrl, linkName = "Unbekannt") {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) return targetUrl;
    try {
        const response = await fetch('https://api.travelpayouts.com/links/v1/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Access-Token': token },
            body: JSON.stringify({
                "trs": 492044,
                "marker": "698672",
                "shorten": true,
                "links": [{ "url": targetUrl }]
            })
        });
        const data = await response.json();
        if (data?.result?.links?.[0]) return data.result.links[0].partner_url;
        return targetUrl;
    } catch (error) {
        console.error(`Fehler bei ${linkName}:`, error);
        return targetUrl;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 302, headers: { 'Location': '/' } };

    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Entdecker";
        const zodiac = params.get('q_zodiac') || "Sternzeichen";
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };

        // 1. Mistral KI-Analyse
        const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_API_KEY}` },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [{
                    role: "user", 
                    content: `Empfiehl ${vorname} ein außergewöhnliches Ferienziel basierend auf: Sternzeichen ${zodiac}, Interessen: ${hobbys}. WICHTIG: Sei kreativ, kein Standard! Antworte NUR in REINEM TEXT, KEINE Sternchen, KEINE Formatierung. Format: ZIEL: [Ort] ANALYSE: [3 Sätze Begründung]`
                }],
                temperature: 0.9
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        // --- ZIEL EXTRAHIEREN & REINIGEN ---
        let zielRaw = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const zielName = zielRaw.replace(/\*/g, '').trim(); 
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Deine perfekten Ferien warten auf dich!";

        // --- GÜLTIGE VERBINDUNGEN (DEINE SHORTLINKS) ---
        
        // Klook (Funktioniert über API)
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, "Klook");

        // Welcome Pickups (Über deinen Shortlink LeqL4Z4E)
        const transferLink = `https://tpk.lv/LeqL4Z4E?u=${encodeURIComponent(`https://www.welcomepickups.com/?destination=${zielName}`)}`;

        // Aviasales (Über deinen Shortlink pXm2idkE)
        const flightLink = `https://tpk.lv/pXm2idkE?u=${encodeURIComponent(`https://www.aviasales.com/search?destination_name=${zielName}`)}`;

        // 2. E-Mail Design
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden; background: #ffffff;">
                <div style="background: #fdfbf7; padding: 40px 20px; text-align: center; border-bottom: 1px solid #eee;">
                    <h1 style="color: #1e293b; margin:0; font-family: serif;">Hallo ${vorname},</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #D4AF37; font-size: 30px; margin: 0 0 25px 0; font-family: serif;">${zielName}</h2>
                    <div style="background: #f8fafc; padding: 25px; border-radius: 15px; text-align: left; line-height: 1.7; color: #334155; border-left: 5px solid #D4AF37; margin-bottom: 35px;">
                        ${analyseText}
                    </div>
                    <div style="margin-top: 20px;">
                        <p style="color: #64748b; font-size: 15px; margin-bottom: 25px;">Exklusive Empfehlungen für deine <strong>Ferien</strong>:</p>
                        <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px;">✨ Erlebnisse in ${zielName}</a>
                        <a href="${transferLink}" style="background: #1e293b; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px;">🚗 Dein Privat-Transfer vor Ort</a>
                        <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; border: 1px solid #cbd5e1;">✈️ Flug-Angebote & Cashback</a>
                    </div>
                </div>
                <div style="padding: 30px; text-align: center; background: #fafafa; font-size: 11px; color: #94a3b8;">
                    &copy; 2026 KI-FERIEN.de | Basierend auf Sternzeichen ${zodiac}.
                </div>
            </div>`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: emailHtml
        });

        return { statusCode: 302, headers: { 'Location': '/success.html' } };
