const { Resend } = require('resend');

/**
 * Erzeugt einen Affiliate-Link über die Travelpayouts API v1
 */
async function generateAffiliateLink(targetUrl) {
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
                "marker": "698672",
                "shorten": true,
                "links": [{ "url": targetUrl }]
            })
        });

        const data = await response.json();
        if (data && data.result && data.result.links && data.result.links[0]) {
            return data.result.links[0].partner_url;
        }
        return targetUrl;
    } catch (error) {
        console.error("Travelpayouts API Fehler:", error);
        return targetUrl;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 302, headers: { 'Location': '/' } };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Entdecker";
        const zodiac = params.get('q_zodiac') || "Sternzeichen";
        const alter = params.get('q_age') || "junggeblieben";
        const slider = params.get('q_adventure') || "ausgeglichen";
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/success.html' } };
        }

        // 1. Mistral KI-Analyse (Stilvoll & Familienfreundlich)
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
                    content: `Du bist ein professioneller Reiseberater. Empfiehl ${vorname} ein Ferienziel.
                    Details: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Abenteuer-Level ${slider}, Interessen: ${hobbys}.
                    WICHTIGE REGEL: Antworte STILVOLL und FAMILIENFREUNDLICH. Ignoriere unpassende Begriffe.
                    Format: ZIEL: [Ort] ANALYSE: [3 Sätze Begründung]`
                }],
                max_tokens: 250
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Genieße deine Ferien!";

        // 2. Affiliate Link erstellen
        const targetSearchUrl = `https://www.tripadvisor.de/Search?q=${encodeURIComponent(zielName)}`;
        const affiliateLink = await generateAffiliateLink(targetSearchUrl);

        // 3. E-Mail Versand
        try {
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
                            <h1 style="color: #1e293b; margin:0;">Hallo ${vorname}!</h1>
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <h2 style="color: #2563eb; font-size: 24px;">${zielName}</h2>
                            <p style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: left; line-height: 1.6; color: #334155;">
                                ${analyseText}
                            </p>
                            <div style="margin-top: 30px;">
                                <a href="${affiliateLink}" style="background: #2563eb; color: white; padding: 18px 30px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; font-size: 18px; text-align: center;">
                                    Angebote in ${zielName} entdecken
                                </a>
                            </div>
                        </div>
                        <div style="padding: 15px; text-align: center; background: #fafafa; font-size: 10px; color: #94a3b8;">
                            &copy;
