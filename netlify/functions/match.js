const { Resend } = require('resend');

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
        const alter = params.get('q_age') || "junggeblieben";
        const slider = params.get('q_adventure') || "ausgeglichen";
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };

        // 1. Mistral KI-Analyse mit Kreativitäts-Parametern
        const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_API_KEY}` },
            body: JSON.stringify({
                model: "mistral-tiny",
                messages: [{
                    role: "user", 
                    content: `Du bist ein exklusiver Reiseberater. Empfiehl ${vorname} ein außergewöhnliches Ferienziel. 
                    Daten: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Abenteuer-Lust: ${slider}/100, Interessen: ${hobbys}. 
                    WICHTIG: Sei kreativ! Wähle NICHT immer Lissabon. Es muss perfekt zu ${hobbys} passen.
                    Antworte NUR in REINEM TEXT, absolut KEINE Sternchen, KEIN Fettdruck. 
                    Format:
                    ZIEL: [Nur Stadtname und Land]
                    ANALYSE: [3 Sätze Begründung warum das Ziel zu diesem Sternzeichen und den Hobbys passt]`
                }],
                max_tokens: 300,
                temperature: 0.85 // Sorgt für Abwechslung bei den Zielen
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        // --- ZIEL EXTRAHIEREN & REINIGEN ---
        let zielRaw = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const zielName = zielRaw.replace(/\*/g, '').trim(); 
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Deine perfekten Ferien warten auf dich!";

        // --- LINKS GENERIEREN ---
        const marker = "698672";
        const trs = "492044";

        // Klook (API ist hier zuverlässig)
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, "Klook");

        // GetTransfer & Aviasales via Shortlink-Redirect (Deep-Link Modus)
        // Wir hängen das Ziel an deine funktionierenden Shortlinks an
        const transferLink = `https://gettransfer.tpk.lv/mPE1eDIa?u=${encodeURIComponent("https://gettransfer.com/de/search?to=" + zielName)}`;
        const flightLink = `https://tpk.lv/pXm2idkE?u=${encodeURIComponent("https://www.aviasales.com/search?destination_name=" + zielName)}`;

        // 2. E-Mail Design
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
                <div style="background: #fdfbf7; padding: 40px 20px; text-align: center; border-bottom: 1px solid #eee;">
                    <h1 style="color: #1e293b; margin:0; font-size: 28px; font-weight: normal;">Hallo ${vorname},</h1>
                    <p style="color: #64748b; margin-top: 10px;">deine Sterne haben gesprochen.</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <span style="text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; font-size: 12px; font-weight: bold;">Dein Seelenort Match</span>
                    <h2 style="color: #1e293b; font-size: 32px; margin: 10px 0 25px 0;">${zielName}</h2>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 15px; text-align: left; line-height: 1.7; color: #334155; border-left: 5px solid #D4AF37; margin-bottom: 35px;">
                        ${analyseText}
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #64748b; font-size: 15px; margin-bottom: 25px;">Exklusive Angebote für deine <strong>Ferien</strong>:</p>
                        
                        <a href="${klookLink}" style="background: #D4AF37; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px; font-size: 16px;">✨ Erlebnisse in ${zielName}</a>
                        
                        <a href="${transferLink}" style="background: #1e293b; color: white; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; margin-bottom: 15px; font-size: 16px;">🚗 Privat-Transfer buchen</a>
                        
                        <a href="${flightLink}" style="background: #ffffff; color: #1e293b; padding: 18px 25px; text-decoration: none; border-radius: 12px; display: block; font-weight: bold; border: 1px solid #cbd5e1; font-size: 16px;">✈️ Flug-Angebote prüfen</a>
                    </div>
                </div>
                <div style="padding: 30px; text-align: center; background: #fafafa; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee;">
                    &copy; 2026 KI-FERIEN.de | Magie & Technologie vereint.<br>
                    Basierend auf deinem Sternzeichen ${zodiac}.
                </div>
            </div>`;

        const today = new Date().toISOString().split('T')[0];
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match ist da: ${zielName} 🌴`,
            html: emailHtml
        }, { idempotencyKey });

        return { statusCode: 302, headers: { 'Location': '/success.html' }, body: '' };

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
