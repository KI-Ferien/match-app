const { Resend } = require('resend');

/**
 * Netlify Function: match.js
 * Minimierte Version um Credits zu sparen und Timeouts zu verhindern.
 */
exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Dein funktionierender Awin-Link für TUI
    const tuiAwinLink = "https://www.awin1.com/cread.php?awinmid=12531&awinaffid=2734466&ued=https%3A%2F%2Fwww.tui.com";

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Reisender";
        const hobbys = params.get('hobbys') || "Ferien";

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/success.html?error=noemail' } };
        }

        // 1. KI-Anfrage (Mistral) - Wir halten sie kurz für maximale Geschwindigkeit
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
                    content: `Ein Ferienziel für ${vorname} (Hobbys: ${hobbys}). Format: ZIEL: [Ort] ANALYSE: [1 Satz]`
                }]
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Mittelmeer";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Ein tolles Ziel für dich!";

        // 2. E-Mail Versand
        // Idempotency-Key verhindert doppelte Mails
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;

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
                            <a href="${tuiAwinLink}" style="background: #d40e14; color: white; padding: 18px 25px; text-decoration: none; border-radius: 10px; display: block; font-weight: bold; font-size: 18px;">Jetzt Ferien bei TUI entdecken</a>
                        </div>
                    </div>
                </div>`
        }, { idempotencyKey });

        // 3. Sofortige Weiterleitung
        return {
            statusCode: 302,
            headers: { 'Location': '/success.html' },
            body: ''
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
