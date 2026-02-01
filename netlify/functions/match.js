const { Resend } = require('resend');

// Hilfsfunktion für Affiliate-Links
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
    } catch (e) {
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
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) return { statusCode: 302, headers: { 'Location': '/success.html?error=mail' } };

        // 1. KI-Analyse mit Fallback-Schutz
        let zielName = "Mittelmeer";
        let analyseText = "Deine Sterne deuten auf eine wunderbare Zeit hin. Genieße deine Ferien!";

        try {
            const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_API_KEY}` },
                body: JSON.stringify({
                    model: "mistral-tiny",
                    messages: [{
                        role: "user", 
                        content: `Reiseberater. Empfiehl ${vorname} ein Ferienziel für: ${zodiac}, Hobbys: ${hobbys}. REINER TEXT, keine Sternchen. Format: ZIEL: [Ort] ANALYSE: [Text]`
                    }],
                    temperature: 0.8
                })
            });
            const kiData = await aiResponse.json();
            const fullText = kiData.choices?.[0]?.message?.content || "";
            
            const matchZiel = fullText.match(/ZIEL:\s*([^\n]*)/i);
            const matchAnalyse = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i);
            
            if (matchZiel) zielName = matchZiel[1].replace(/\*/g, '').trim();
            if (matchAnalyse) analyseText = matchAnalyse[1].trim();
        } catch (aiErr) {
            console.error("Mistral Fehler, nutze Fallback");
        }

        // 2. Links generieren
        const marker = "698672";
        const trs = "492044";
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`);
        
        const transferTarget = `https://gettransfer.com/de/search?to=${encodeURIComponent(zielName)}`;
        const transferLink = `https://tp.media/r?marker=${marker}&trs=${trs}&p=2335&u=${encodeURIComponent(transferTarget)}`;

        const flightTarget = `https://www.aviasales.com/search?destination_name=${encodeURIComponent(zielName)}`;
        const flightLink = `https://tp.media/r?marker=${marker}&trs=${trs}&p=4114&u=${encodeURIComponent(flightTarget)}`;

        // 3. E-Mail Versand
        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden;">
                    <div style="background: #fdfbf7; padding: 30px; text-align: center;">
                        <h1 style="color: #1e293b;">Hallo ${vorname}!</h1>
                        <h2 style="color: #D4AF37;">${zielName}</h2>
                        <p style="text-align: left; padding: 20px; background: #f8fafc; border-radius: 10px;">${analyseText}</p>
                        <div style="margin-top: 25px;">
                            <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 15px; text-decoration: none; border-radius: 10px; display: block; margin-bottom: 10px;">✨ Erlebnisse in ${zielName}</a>
                            <a href="${transferLink}" style="background: #1e293b; color: white; padding: 15px; text-decoration: none; border-radius: 10px; display: block; margin-bottom: 10px;">🚗 Privat-Transfer</a>
                            <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 15px; text-decoration: none; border-radius: 10px; display: block; border: 1px solid #ccc;">✈️ Flug-Angebote</a>
                        </div>
                    </div>
                </div>`
        });

        return { statusCode: 302, headers: { 'Location': '/success.html' } };

    } catch (error) {
        console.error("Kritischer Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
