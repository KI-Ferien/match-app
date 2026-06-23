// netlify/functions/match.js
// Komplett eigenständige und lauffähige Engine für KI-Ferien.de

const ASTR_DATA = {
  widder: { name: "Widder", element: "Feuer" },
  stier: { name: "Stier", element: "Erde" },
  zwillinge: { name: "Zwillinge", element: "Luft" },
  krebs: { name: "Krebs", element: "Wasser" },
  loewe: { name: "Löwe", element: "Feuer" },
  jungfrau: { name: "Jungfrau", element: "Erde" },
  waage: { name: "Waage", element: "Luft" },
  skorpion: { name: "Skorpion", element: "Wasser" },
  schuetze: { name: "Schütze", element: "Feuer" },
  steinbock: { name: "Steinbock", element: "Erde" },
  wassermann: { name: "Wassermann", element: "Luft" },
  fische: { name: "Fische", element: "Wasser" }
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Nur POST erlaubt.' }) };

  try {
    const payload = JSON.parse(event.body);
    const { signs, participants, vibe, budget, distance } = payload;

    if (!signs || !Array.isArray(signs) || signs.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Keine Sternzeichen übergeben.' }) };
    }

    const primarySignName = signs[0].toLowerCase();
    const signInfo = ASTR_DATA[primarySignName] || { name: signs[0], element: "Universell" };

    const elementFocus = {
      Feuer: "Physische Herausforderung, Pionier-Erlebnisse, weite Landschaften und Dynamik.",
      Erde: "Natur-Resonanz, Entschleunigung, erdende Rückzugsorte und Kulinarik.",
      Luft: "Kultureller Intellekt, urbane Vielfalt, Architektur und inspirierender Austausch.",
      Wasser: "Tiefe Reflexion, Küsten- oder Seenlandschaften, absolute Ruhe und emotionale Regeneration.",
      Universell: "Harmonische Balance aus Entdeckung und Erholung."
    };

    const finalPrompt = `
Du bist die astrologische KI-Engine von KI-Ferien.de. Generiere eine maßgeschneiderte Reiseanalyse.
Fokus-Sternzeichen: ${signInfo.name} (Element: ${signInfo.element})
Psychografischer Fokus: ${elementFocus[signInfo.element]}

ZUSÄTZLICHE PARAMETER (Strikt beachten für die Empfehlungen):
- Anzahl der Reisenden: ${participants}
- Gewünschter Vibe: ${vibe}
- Budget: ${budget}
- Maximale Distanz: ${distance}

STRIKTE REGELN:
1. Keine oberflächlichen Klischees. Begründe psychologisch fundiert anhand des Elements.
2. Schlage konkrete, existierende Orte vor (Stadt, Land).
3. Gib das Ergebnis ZWINGEND als JSON-Objekt in exakt folgendem Format zurück, ohne weiteren Text:
{
  "vibe_keynote": "Ein prägnanter Satz zum aktuellen Reise-Mantra.",
  "destinationen": [
    {
      "ort": "Stadt, Land",
      "astro_matching_grund": "Detaillierte, psychologische Begründung (Max. 3 Sätze).",
      "link_type": "in_app_browser"
    }
  ]
}
`.trim();

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY fehlt.");

    // Globale Fetch API (Standard in modernen Netlify Node-Umgebungen)
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: finalPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!mistralResponse.ok) throw new Error(`Mistral API Fehler: ${mistralResponse.status}`);

    const mistralData = await mistralResponse.json();
    const cleanResult = JSON.parse(mistralData.choices[0].message.content);

    // Garantiert die exakte Rückgabe an die App
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result: cleanResult })
    };

  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Serverfehler.', details: error.message })
    };
  }
};
