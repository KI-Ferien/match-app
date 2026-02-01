const { Resend } = require('resend');

// Wir nutzen die API NUR noch für Klook, da dies bei dir funktioniert.
async function generateAffiliateLink(targetUrl) {
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
        return data?.result?.links?.[0]?.partner_url || targetUrl;
    } catch (e) { return targetUrl; }
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

        if (!email) return { statusCode: 302, headers: { 'Location': '/success.html?error=mail' } };

        // 1. KI-Analyse
        const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_API_KEY}` },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [{
                    role: "user", 
                    content: `Empfiehl ${vorname} ein Ferienziel für: ${zodiac}, Hobbys: ${hobbys}. REINER TEXT, keine Sternchen. Format: ZIEL: [Ort] ANALYSE: [Text]`
                }],
                temperature: 0.9
            })
        });
        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        let zielRaw = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const zielName = zielRaw.replace(/\*/g, '').trim(); 
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Genieße deine Ferien!";

        // --- 2. GÜLTIGE VERBINDUNGEN OHNE FEHLERMELDUNG ---
        const marker = "698672";

        // Klook: Funktioniert bei dir über API
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`);

        // Welcome Pickups: Wir nutzen den absoluten Basis-Affiliate-Link. 
        // Falls Deep-Links blockiert sind, führt dieser sicher auf die Startseite (mit Tracking!)
        const transferLink = `https://www.welcomepickups.com/?tap_a=23245-77987a&tap_s=${marker}-698672`;

        // Aviasales: Stabiler Standard-Partnerlink
        const flightLink = `https://www.aviasales.com/?marker=${marker}`;

        // 3. E-Mail Versand
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden;">
                <div style="background: #fdfbf7; padding: 30px; text-align: center;">
                    <h1 style="color: #1e293b;">Hallo ${vorname}!</h1>
                    <h2 style="color: #D4AF37;">${zielName}</h2>
                    <p style="text-align: left; padding: 20px; background: #f8fafc; border-radius: 10px; line-height: 1.6;">${analyseText}</p>
                    <div style="margin-top: 30px;">
                        <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 12px;">✨ Erlebnisse in ${zielName}</a>
                        <a href="${transferLink}" style="background: #1e293b; color: white; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 12px;">🚗 Dein Privat-Transfer vor Ort</a>
                        <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; border: 1px solid #cbd5e1;">✈️ Flug-Angebote & Cashback</a>
                    </div>
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

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
