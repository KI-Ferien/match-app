const fetch = require('node-fetch');

exports.handler = async (event) => {
  // CORS-Header, damit das Frontend reden darf
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Vorab-Check für Browser-Anfragen (Preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { participants } = JSON.parse(event.body);
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'API-Key fehlt in den Netlify-Einstellungen.' }) 
      };
    }

    // Den Prompt für die KI erstellen
    const prompt = `Erstelle eine kurze, inspirierende Empfehlung für ein Ferien-Ziel (bitte das Wort Ferien statt Urlaub verwenden) basierend auf diesen Teilnehmern: ${JSON.stringify(participants)}. Antworte in 3-4 Sätzen.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recommendation })
    };

  } catch (error) {
    console.error('Fehler im Backend:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Fehler bei der KI-Analyse: ' + error.message })
    };
  }
};
