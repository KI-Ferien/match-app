// netlify/functions/match.js

function getFallbackData(signs) {
  return {
    destination: "Schwarzwald",
    welcome_pickups_city: "stuttgart",
    explanation: `Das Orakel ruht gerade mangels API-Schlüssel lokal im Labor. Dies ist eine astrologische Resonanz für die Sternzeichen ${signs || 'Keine'} für deine Ferien. Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Kosho Yamamoto 1973), liegt wahres Glück in der bewussten Einkehr. Das Konzept des Atman (Merriam-Webster 2003) spiegelt sich in den majestätischen Wipfeln des Waldes wider.`,
    bestTimeTip: "Mai bis September",
    packliste: ["Premium-Wanderschuhe", "Winddichte Softshelljacke", "Stilvolles Reisetagebuch"],
    cta_text: "Ferien Erlebnisse buchen"
  };
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
    }
    
    const payload = JSON.parse(event.body);
    const signs = Array.isArray(payload.signs) ? payload.signs.join(', ') : 'Keine spezifischen';
    const participants = Number(payload.participants) || 2;
    const vibe = payload.vibe || 'Fließende Balance';
    const budget = payload.budget || 'Goldene Mitte';
    const distance = payload.distance || 'Nachbarreiche';
    const transport = payload.transport || 'Flug der Falken';

    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackData(signs);
      return { statusCode: 200, headers, body: JSON.stringify(fallback) };
    }

    const today = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Du bist ein hochentwickeltes astrologisches Orakel für Ferien. /astro
    Heutiges Datum: ${today}.
    Parameter: ${participants} Personen, Sternzeichen ${signs}, Vibe: ${vibe}, Budget: ${budget}, Entfernung: ${distance}, Fortbewegung: ${transport}.

    REGELN:

    1. GEOGRAFIE & ZIELWAHL: "Heimatliche Gefilde"/"Nachbarreiche" = DACH + direkt angrenzend, bevorzugt aus: Schwarzwald, Bodensee, Allgäu, Bayerischer Wald, Sauerland, Mosel, Rheingau, Spreewald, Harz, Ostseeküste, Nordseeküste, Nibelungensteig (Odenwald), Burgensteig Bergstraße, Straßburg, Salzburg.
    "Kontinentale Weite" = Europa, bevorzugt aus: Toskana, Lissabon, Wien, Amalfiküste, Griechische Inseln, Côte d'Azur, italienische Thermenregionen.
    "Ans Ende der Welt" = weltweit, z.B. Kanada für Abenteuer-Anfragen.
    Wähle abwechslungsreich aus dem Pool - nicht wiederholt dasselbe Ziel bei unterschiedlichen Sternzeichen.

    2. ASTRO + GRUPPE: Verknüpfe die Charaktereigenschaften von ${signs} konkret und stimmig mit dem Ziel. Berücksichtige ${participants} Personen bei der Zielwahl UND skaliere die Packliste entsprechend (z.B. "${participants}x Regenmäntel" statt nur "Regenmantel").

    3. BUDGET "${budget}": spiegelt sich in Ziel-Charakter und Packliste wider (einfach/ausgewogen/exklusiv je nach Stufe).

    4. SAISON: "bestTimeTip" muss zum heutigen Datum (${today}) passen.

    5. PFLICHT: Packliste = 3 reale Profi-Items (skaliert nach Personenzahl), KEINE Kameras. Explanation MUSS enthalten: Buddha/Mahapäriniviranä Sutra (Kosho Yamamoto 1973) UND Atman-Konzept (Merriam-Webster 2003). Nutze immer "Ferien" statt "Urlaub".

    WICHTIG VOR DER AUSGABE: Prüfe nochmal, dass die Packliste die ${participants} Personen widerspiegelt (nicht nur Singular-Items).

    Antworte AUSSCHLIESSLICH als JSON ohne Markdown:
    {
      "destination": "Schwarzwald",
      "welcome_pickups_city": "stuttgart",
      "explanation": "Begründung inkl. Sternzeichen, Gruppengröße, Buddha (Yamamoto 1973), Atman (Webster 2003).",
      "bestTimeTip": "Beste Reisezeit passend zum aktuellen Datum",
      "packliste": ["Item 1 skaliert", "Item 2 skaliert", "Item 3 skaliert"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    if (typeof globalThis.fetch !== 'function') {
      return { statusCode: 200, headers, body: JSON.stringify(getFallbackData(signs)) };
    }

    const mistralRes = await globalThis.fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey.trim()}` 
      },
      body: JSON.stringify({ 
        model: "mistral-small-latest", 
        messages: [{ role: "user", content: prompt }], 
        temperature: 0.8 
      })
    });

    if (!mistralRes.ok) throw new Error(`API error ${mistralRes.status}`);

    const mistralData = await mistralRes.json();
    let rawText = mistralData.choices[0].message.content.trim();
    
    const backtickPattern = '\\x60\\x60\\x60';
    const fenceRegex = new RegExp(`${backtickPattern}(?:json)?\\s*([\\s\\S]*?)\\s*${backtickPattern}`, 'i');
    const fenceMatch = rawText.match(fenceRegex);

    if (fenceMatch && fenceMatch[1]) rawText = fenceMatch[1].trim();
    if (!rawText.startsWith('{')) {
      const firstJson = rawText.match(/\{[\s\S]*?\}/);
      if (firstJson) rawText = firstJson[0];
    }

    const parsed = JSON.parse(rawText);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    
  } catch (apiError) {
    return { statusCode: 200, headers, body: JSON.stringify(getFallbackData('Widder')) };
  }
};
