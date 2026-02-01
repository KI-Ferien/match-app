const { Resend } = require('resend');

/**
 * Erzeugt einen Affiliate-Link über die Travelpayouts API v1
 */
async function generateAffiliateLink(targetUrl, linkName = "Unbekannt") {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) {
        console.warn(`[Affiliate] Kein Token gefunden für: ${linkName}`);
        return targetUrl;
    }

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
        
        if (!response.ok) {
            console.error(`[Affiliate Error] API-Status ${response.status} für ${linkName}:`, data);
            return targetUrl;
        }

        if (data && data.result && data.result.links && data.result.links[0]) {
            console.log(`[Affiliate Success] Link generiert für: ${linkName}`);
            return data.result.links[0].partner_url;
        }

        return targetUrl;
    } catch (error) {
        console.error(`[Affiliate Exception] Fehler bei ${linkName}:`, error);
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
            return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };
        }

        // 2. Mistral KI-Analyse
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
                    Details: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Abenteuer-Level ${slider}, 
                    Interessen: ${hobbys}. Antworte STILVOLL und FAMILIENFREUNDLICH. Format: ZIEL: [Ort] ANALYSE: [3 Sätze Begründung]`
                }],
                max_tokens: 250
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Genieße deine Ferien!";

        // --- Dynamische Travelpayouts Links generieren ---
        const klookLink = await generateAffiliateLink(
            `https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, 
            "Klook"
        );
        const transferLink = await generateAffiliateLink(
    `https://gettransfer.com/de/search?to=${encodeURIComponent(zielName)}`, 
    "GetTransfer"
);
        const flightLink = await generateAffiliateLink(
            `https://www.aviasales.com/search?destination_name=${encodeURIComponent(zielName)}`, 
            "Aviasales"
        );

        // 3. E-Mail Inhalt generieren
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden;">
                <div style="background: #fdfbf7; padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
                    <h1 style="color: #1e293b; margin:0; font-family: serif;">Hallo ${vorname}!</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <h2 style="color: #D4AF37; font-size: 26px; font-family: serif;">${zielName}</h2>
                    <p style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: left; line-height: 1.6; color: #334155; border-left: 4px solid #D4AF37;">${analyseText}</p>
                    
                    <div style="margin-top: 30px;">
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Passend zu deiner Analyse haben wir diese Empfehlungen für dich:</p>
                        
                        <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 12px;">✨ Erlebnisse in ${zielName} entdecken</a>
                        
                        <a href="${transferLink}" style="background: #1e293b; color: white; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 12px;">🚗 Dein Privat-Transfer vor Ort</a>
                        
                        <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 15px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; border: 1px solid #cbd5e1;">✈️ Flug-Angebote & Cashback</a>
                    </div>
                </div>
                <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 11px; color: #94a3b8;">
                    &copy; 2026 KI-FERIEN | Basierend auf Sternzeichen ${zodiac}. <br>
                    Finde dein Zuhause im Herzen auf <strong>ki-ferien.de</strong>
                </div>
            </div>`;

        // 4. E-Mail Versand
        const today = new Date().toISOString().split('T')[0];
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Seelenort Match: ${zielName} 🌴`,
            html: emailHtml
        }, { idempotencyKey });

        return {
            statusCode: 302,
            headers: { 'Location': '/success.html', 'Cache-Control': 'no-cache' },
            body: ''
        };

    } catch (error) {
        console.error("Globaler Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
