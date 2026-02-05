exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    
    const { participants } = JSON.parse(event.body);
    const mistralKey = process.env.MISTRAL_API_KEY;

    // Erstelle den Prompt basierend auf der Gruppe
    const prompt = `Finde ein optimales Urlaubsziel (Ferien) für eine Gruppe mit folgenden Profilen: 
    ${participants.map(p => `${p.zodiac} (gefühltes Alter ${p.age})`).join(', ')}. 
    Berücksichtige die astrologischen Harmonien und gib eine kurze, begeisternde Empfehlung.`;

    try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${mistralKey}`
            },
            body: JSON.stringify({
                model: "mistral-medium",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ recommendation: data.choices[0].message.content })
        };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};
