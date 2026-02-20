const { Resend } = require('resend');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { email, zodiacs, vibe, budget, hobbies, persons, marker, project } = JSON.parse(event.body);
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Hier würde die Mistral-Analyse generiert werden
        const analysis = `Deine kosmischen Ferien für die Konstellation ${zodiacs.join(' & ')}.`;

        await resend.emails.send({
            from: 'KI-Ferien <info@ki-ferien.de>',
            to: email,
            subject: `Deine Kosmische Ferien-Analyse ist da!`,
            html: `
                <h1>Deine KI-Ferien Analyse</h1>
                <p>${analysis}</p>
                <p><strong>Exklusive Ferien-Angebote für dich:</strong></p>
                <ul>
                    <li><a href="https://ki-ferien.de/search?marker=${marker}">Passende Flüge & Hotels finden</a></li>
                </ul>
                <p>Projekt-ID: ${project}</p>
            `
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Email versendet" }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
