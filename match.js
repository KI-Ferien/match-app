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

    const prompt = `Du bist ein hochentwickeltes astrologisches Orakel für Ferien. /astro
    Analysiere folgende Parameter für ${participants} Personen der Sternzeichen ${signs}:
    Erlebnis-Wunsch: ${vibe}
    Budget-Pfad: ${budget}
    Gewünschte Entfernung: ${distance}
    Art der Fortbewegung: ${transport}
    
    WICHTIGE REGELN FÜR DEINE EMPFEHLUNG:
    1. Geografische Bindung: "Heimatliche Gefilde" und "Nachbarreiche" bedeuten ZWINGEND DACH-Region. "Kontinentale Weite" bedeutet ZWINGEND Europa. Alles andere ist weltweit.

    2. REGIONEN-POOL, aus dem du bevorzugt wählen sollst (statt frei zu improvisieren):

    Für "Heimatliche Gefilde" und "Nachbarreiche" (DACH-Region), wähle bevorzugt aus:
    Schwarzwald, Bodensee, Allgäu, Allgäuer Seenland, Bayerischer Wald, Sauerland, Mosel, Rheingau,
    Fränkische Schweiz, Spreewald, Harz, Ostseeküste (Rügen/Usedom), Nordseeküste (Sylt/Ostfriesland),
    Lüneburger Heide, Eifel, Vulkaneifel, Chiemgau, Fichtelgebirge, Schwäbische Alb, Teutoburger Wald,
    Berchtesgadener Land, Elbsandsteingebirge/Sächsische Schweiz, Weserbergland, Ruhrgebiet, Insel Amrum/Föhr,
    Nibelungensteig (Odenwald), Alemannenweg (Odenwald/Bergstraße), Burgensteig Bergstraße (Darmstadt-Heidelberg).

    Für "Kontinentale Weite" (Europa), wähle bevorzugt aus:
    Toskana, Lissabon, Wien, Amalfiküste, Marokko (falls noch Europa-nah gewertet), Griechische Inseln,
    Côte d'Azur, sowie italienische Wellness-/Thermenregionen (z.B. Toskana-Thermen) für ruhige, entspannungsorientierte Anfragen.

    Für "Ans Ende der Welt" (weltweit), erwäge auch:
    Kanada (Rocky Mountains, Nationalparks, Wildnis) für abenteuerlustige, naturverbundene Anfragen.

    Weiche von diesem Pool ab, wenn die Sternzeichen-Kombination oder der Vibe eindeutig besser zu einem anderen, thematisch passenderen Ziel führt - der Pool ist eine bevorzugte Auswahl, keine starre Pflichtliste.

    3. Die Packliste MUSS 3 REALE, hochprofessionelle Ausrüstungsgegenstände enthalten. NENNE KEINE KAMERAS. Nenne stattdessen exklusives Premium-Gepäck, High-Tech Kleidung oder Gadgets. ERFINDE KEINE esoterischen Gegenstände.
    4. Die Begründung ('explanation') MUSS ZWINGEND diese Quellen einbinden: 
       - Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973).
       - Das Konzept des Atman (Hinduismus, Merriam-Webster 2003).
    5. Nutze immer das Wort "Ferien".
    6. Beachte simulierte Reise- und Sicherheitswarnungen.
    
    UNBEDINGTE JSON-STRUKTUR:
    - destination: Der klangvolle Ferienort oder Name der Ferienregion auf Deutsch für das Display (z.B. "Schwarzwald", "Istrien", "Toskana").
    - welcome_pickups_city: AUSSCHLIESSLICH die für diese Region optimale Flughafen- oder Ankunftsstadt von Welcome Pickups komplett in Kleinbuchstaben, ohne Sonderzeichen (z.B. statt "Schwarzwald" nimmst du "stuttgart", statt "Istrien" nimmst du "pula", statt "Toskana" nimmst du "pisa").
    
    Antworte AUSSCHLIESSLICH als JSON-Objekt ohne Markdown:
    {
      "destination": "Schwarzwald",
      "welcome_pickups_city": "stuttgart",
      "explanation": "Tiefgründige Begründung auf Deutsch inkl. Sternzeichen, Buddha (Yamamoto 1973) und Atman (Webster 2003).",
      "bestTimeTip": "Beste Reisezeit",
      "packliste": ["Reales Profi-Item 1", "Reales Profi-Item 2", "Reales Profi-Item 3"],
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
        temperature: 0.7 
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
