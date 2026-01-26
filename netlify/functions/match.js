const { Resend } = require('resend');

exports.handler = async (event) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    // Dein Tracking-Link für TUI
    const tuiAwinLink = "https://www.awin1.com/awclick.php?mid=12531&id=2734466";

    try {
        const params = new URLSearchParams(event.body);
        const email = params.get('email');
        const vorname = params.get('vorname') || "Reisender";
        
        // Neue Felder extrahieren
        const zodiac = params.get('q_zodiac') || "Entdecker";
        const alter = params.get('q_age') || "junggeblieben";
        const slider = params.get('q_adventure') || "ausgeglichen"; // Pure Entspannung vs Abenteuer pur
        const hobbys = params.get('hobbys') || "Ferien genießen";

        if (!email) {
            return { statusCode: 302, headers: { 'Location': '/success.html' } };
        }

        // 1. KI-Anfrage (Mistral) mit allen Parametern
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
                    content: `Du bist ein Reiseexperte. Erstelle ein Ferien-Match für ${vorname}.
                    Details: 
                    - Sternzeichen: ${zodiac}
                    - Gefühltes Alter: ${alter}
                    - Präferenz (Slider): ${slider} (Skala von Entspannung bis Abenteuer)
                    - Interessen & Beschreibung: ${hobbys}
                    
                    Wähle ein Ziel und begründe es. Beziehe dich im Text direkt auf das Sternzeichen, das gefühlte Alter und ob es eher entspannt oder abenteuerlich zugeht.
                    
                    Format:
                    ZIEL: [Name des Ortes]
                    ANALYSE: [3-4 inspirierende Sätze]`
                }],
                max_tokens: 250
            })
        });

        const kiData = await aiResponse.json();
        const fullText = kiData.choices?.[0]?.message?.content || "";
        const zielName = fullText.match(/ZIEL:\s*([^\n]*)/i)?.[1]?.trim() || "Traumziel";
        const analyseText = fullText.match(/ANALYSE:\s*([\s\S]*?)$/i)?.[1]?.trim() || "Ein perfekt auf dich abgestimmtes Ziel.";

        // 2. E-Mail Versand
        const today = new Date().toISOString().split('T')[0];
        const idempotencyKey = `match-${email.replace(/[^a-zA-Z0-9]/g, '')}-${today}`;

        await resend.emails.send({
            from: 'KI-FERIEN <info@ki-ferien.de>',
            to: email,
            bcc: 'mikostro@web.de', 
            subject: `Dein Ferien-Match: ${zielName} 🌴`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 24px; overflow: hidden;">
                    <div style="background: #eff6ff; padding: 40px; text-align: center;">
                        <h1 style="color: #1e293b; margin:0;">Hallo ${vorname}!</h1>
                        <p style="color: #2563eb; font-weight: bold; margin-top: 10px;">Deine Analyse ist fertig.</p>
                    </div>
                    <div style="padding: 40px; text-align: center;">
                        <h2 style="color: #1e293b; font-size: 28px; margin-bottom: 20px;">${zielName}</h2>
                        <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border-left: 4px solid #2563eb; color: #1e3a8a; line-height: 1.6; text-align: left;">
                            ${analyseText}
                        </div>
                        <div style="margin-top: 35px;">
                            <a href="${tuiAwinLink}" style="background: #d40e14; color: white; padding: 20px 40px; text-decoration: none; border-radius: 16px; font-weight: bold; font-size: 18px; display: inline-block;">
                                Passende Angebote bei TUI finden
                            </a>
                        </div>
                    </div>
                    <div style="padding: 20px; text-align: center; background: #fafafa; font-size: 11px; color: #94a3b8;">
                        &copy; 2026 KI-FERIEN. Basierend auf deinem Sternzeichen ${zodiac} und deinen Vorlieben.
                    </div>
                </div>`
        }, { idempotencyKey });

        return {
            statusCode: 302,
            headers: { 
                'Location': '/success.html',
                'Cache-Control': 'no-cache'
            },
            body: ''
        };

    } catch (error) {
        console.error("Fehler:", error);
        return { statusCode: 302, headers: { 'Location': '/success.html?error=true' } };
    }
};
