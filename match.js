// netlify/functions/match.js
// Vollständige Serverless Function Schnittstelle für KI-Ferien.de
// Verbindet das Frontend mit der Mistral-API und der match-Engine

const { generateMistralPrompt, getAstroUiDefinition } = require('./match-engine.js'); // Falls als separate Engine-Datei exportiert, sonst Pfad anpassen

exports.handler = async (event, context) => {
  // CORS-Header für reibungslose App-/Web-Kommunikation
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Vorab-Prüfung für Browser (Preflight-Requests)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Methode nicht erlaubt. Bitte nutze POST.' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { signs, participants, vibe, budget, distance } = payload;

    if (!signs || !Array.isArray(signs) || signs.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Keine Sternzeichen übergeben.' })
      };
    }

    // Wir nutzen das primäre Sternzeichen für die astrologische Ausrichtung des Prompts
    const primarySign = signs[0];
    const mistralPrompt = generateMistralPrompt(primarySign);

    // Erweiterung des Prompts um die dynamischen UI-Parameter der Schieberegler
    const finalPrompt = `
${mistralPrompt}

ZUSÄTZLICHE REISEPARAMETER AUS DEM ORAKEL:
- Anzahl der Reisenden (Gefährten): ${participants}
- Gewünschter Vibe: ${vibe}
- Budget-Pfad: ${budget}
- Maximale Distanz: ${distance}

Generiere das JSON-Ergebnis exakt basierend auf diesen Parametern.
`.trim();

    // MISTRAL API-AUFRUF
    // Vergewissere dich, dass MISTRAL_API_KEY in deinen Netlify-Umgebungsvariablen (Environment Variables) hinterlegt ist!
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("Mistral API Key fehlt in den Netlify Umgebungsvariablen.");
    }

    const fetch = (await import('node-fetch')).default; // Dynamischer Import für Netlify Node-Umgebungen
    
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest', // Professionelles, hochqualitatives Modell für komplexe Logik
        messages: [{ role: 'user', content: finalPrompt }],
        response_format: { type: 'json_object' }, // Erzwingt sauberes JSON von Mistral
        temperature: 0.7
      })
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      throw new Error(`Mistral API Fehler: ${mistralResponse.status} - ${errorText}`);
    }

    const mistralData = await mistralResponse.json();
    const aiContent = mistralData.choices[0].message.content;

    // Parsen der KI-Antwort zur Validierung vor dem Versand an das Frontend
    const cleanResult = JSON.parse(aiContent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result: cleanResult })
    };

  } catch (error) {
    console.error("Netlify Function Error:", error);
    
    // Im Fehlerfall senden wir einen kontrollierten Status an das Frontend, 
    // damit die reise.html weiß, dass sie den Fallback-Modus aktivieren muss.
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Interner Serverfehler im Orakel-Zentrum.',
        details: error.message 
      })
    };
  }
};
