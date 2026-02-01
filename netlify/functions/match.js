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
        return data?.result?.links?.[0]?.partner_url || targetUrl;
    } catch (error) {
        console.error(`Fehler bei ${linkName}:`, error);
        return targetUrl;
    }
}

exports.handler = async (event) => {
    // 1. Sicherheit: Nur POST zulassen
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
        const hobbys = params.get('hobbys') || "Ferien genießen";
        const budget = params.get('q_budget') || "1500"; 

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };
        }

        // 2. Mistral KI-Analyse mit Timeout-Schutz
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        let zielName = "Mittelmeer";
        let analyseText = "Deine Sterne deuten auf eine wunderbare Zeit hin. Genieße deine Ferien!";

        try {
            const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                signal: controller.signal,
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${MISTRAL_API_KEY}` 
                },
                body: JSON.stringify({
                    model: "mistral-tiny",
                    messages: [{
                        role: "user", 
                        content: `Reiseberater. Empfiehl ${vorname} ein Ferienziel. Daten: Sternzeichen ${zodiac}, Hobbys: ${hobbys}, Budget: ${budget}€. Antworte NUR in REINEM TEXT, KEINE Sternchen. Format: ZIEL: [Ort] ANALYSE: [Text]`
                    }],
                    temperature: 0.9
                })
            });

            const kiData = await aiResponse.json();
            const fullText = kiData.choices?.[0]?.message?.content || "";

            const matchZiel = fullText.match(/ZIEL:\s*([^\n]*)/i);
            const matchAnalyse = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i);

            if (matchZiel) zielName = matchZiel[1].replace(/\*/g, '').trim();
            if (matchAnalyse) analyseText = matchAnalyse[1].trim();

        } catch (aiError) {
            console.error("KI-Fehler:", aiError);
        } finally {
            clearTimeout(timeoutId);
        }

        // 3. Affiliate Links
        const marker = "698672";
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, "Klook");
        const transferLink = `https://www.welcomepickups.com/?tap_a=23245-77987a&tap_s=${marker}-698672`;
        const flightLink = `https://www.aviasales.com/?marker=${marker}`;

        // 4. E-Mail Versand
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden; background: #ffffff;">
                <div style="background: #fdfbf7; padding: 40px 20px; text-align: center; border-bottom: 1px solid #eee;">
                    <h1 style="color: #1e293b; margin:0;">Hallo ${vorname},</h1>
                    <p style="color: #64748b;">Dein Budget: ${budget} € | Dein Match ist da.</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #D4AF37; font-size: 30px; margin: 0 0 25px 0;">${zielName}</h2>
                    <div style="background: #f8fafc; padding: 25px; border-radius: 15px; text-align: left; line-height: 1.7; color: #334155; border-left: 5px solid #D4AF37; margin-bottom: 35px;">
                        ${analyseText}
                    </div>
                    <div style="margin-top: 20px;">
                        <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px;">✨ Erlebnisse in ${zielName}</a>
                        <a href="${transferLink}" style="background: #1e293b; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px;">🚗 Privat-Transfer vor Ort</a>
                        <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; border: 1px solid #cbd5e1;">✈️ Flug-Angebote</a>
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
        console.error("Kritischer Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
