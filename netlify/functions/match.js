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
    // 1. Sicherheit: Nur POST-Anfragen
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

        // 2. Mistral KI-Analyse mit hoher Temperature für maximale Abwechslung
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
                    content: `Du bist ein erfahrener Reise-Astrologe. Empfiehl ${vorname} ein einzigartiges Ferienziel. 
                    Daten: Sternzeichen ${zodiac}, gefühltes Alter ${alter}, Abenteuer-Lust: ${slider}/100, Interessen: ${hobbys}. 
                    WICHTIG: Sei extrem kreativ! Wähle NICHT immer Lissabon oder Paris. Es muss exakt zu den Hobbys passen.
                    Antworte NUR in REINEM TEXT, absolut KEINE Sternchen, KEIN Fettdruck, kein Markdown. 
                    Format:
                    ZIEL: [Stadtname und Land]
                    ANALYSE: [3 Sätze Begründung warum das Ziel energetisch zu ${zodiac} und ${hobbys} passt]`
                }],
                max_tokens: 300,
                temperature: 0.9 // Verhindert repetitive Ergebnisse
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";

        // --- ZIEL EXTRAHIEREN & REINIGEN (Wichtig für funktionierende Links!) ---
        let zielRaw = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        // Entfernt alle Sternchen (*), die die Links unbrauchbar machen würden
        const zielName = zielRaw.replace(/\*/g, '').trim(); 
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Deine perfekten Ferien warten auf dich!";

        // --- DYNAMISCHE AFFILIATE LINKS ---
        const marker = "698672";
        const trs = "492044";

        // Klook (Nutzt API für Shortlinks)
        const klookLink = await generateAffiliateLink(
            `https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, 
            "Klook"
        );

        // GetTransfer & Aviasales via Universal-Redirect (Stabilster Deep-Link-Weg)
        const transferTarget = `https://gettransfer.com/de/search?to=${encodeURIComponent(zielName)}`;
        const transferLink = `https://tp.media/r?marker=${marker}&trs=${trs}&p=2335&u=${encodeURIComponent(transferTarget)}`;

        const flightTarget = `https://www.aviasales.com/search?destination_name=${encodeURIComponent(zielName)}`;
        const flightLink = `https://tp.media/r?marker=${marker}&trs=${trs}&p=4114&u=${encodeURIComponent(flightTarget)}`;

        // 3. E-Mail Design (Optimiert für Ferien-Branding)
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #D4AF37; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
                <div style="background: #fdfbf7; padding: 40px 20px; text-align: center; border-bottom: 1px solid #eee;">
                    <h1 style="color: #1e293b; margin:0; font-size: 28px; font-weight
