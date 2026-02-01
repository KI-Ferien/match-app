const { Resend } = require('resend');

/**
 * Erzeugt einen Affiliate-Link über die Travelpayouts API v1
 * Optimiert für Klook.
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
    // Sicherheit: Nur POST zulassen
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

        // 1. Mistral KI-Analyse mit Timeout-Schutz gegen "Invocation Failed"
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500); // 8.5 Sekunden Limit

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
                        content: `Professioneller Reiseberater. Empfiehl ${vorname} ein Ferienziel. 
                        Daten: Sternzeichen ${zodiac}, Interessen: ${hobbys}, Budget: ${budget}€.
                        WICHTIG: Ziel muss zum Budget passen. Antworte NUR in REINEM TEXT, KEINE Sternchen, KEIN Markdown.
                        Format: ZIEL: [Ort] ANALYSE: [3 Sätze Begründung]`
                    }],
                    temperature: 0.9
                })
            });

            const kiData = await aiResponse.json();
            const fullText = kiData.choices?.[0]?.message?.content || "";

            // Ziel und Analyse extrahieren & bereinigen
            const matchZiel = fullText.match(/ZIEL:\s*([^\n]*)/i);
            const matchAnalyse = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i);

            if (matchZiel) zielName = matchZiel[1].replace(/\*/g, '').trim();
            if (matchAnalyse) analyseText = matchAnalyse[1].trim();

        } catch (aiError) {
            console.error("KI-Timeout oder Fehler, nutze Fallback-Ziel.");
        } finally {
            clearTimeout(timeoutId);
        }

        // 2. Affiliate Links (Klook dynamisch, andere stabil als Basis-Links)
        const marker = "698672";
        const klookLink = await generateAffiliateLink(`https://www.klook.com/de/search?query=${encodeURIComponent(zielName)}`, "Klook");
        
        // Basis-Links ohne Deep-Link-Umwege (um "not subscribed" Fehler zu vermeiden)
        const transferLink = `https://www.welcomepickups.com/?tap_a=23245-77987a&tap_s=${marker}-698672`;
        const flightLink = `https://www.av
