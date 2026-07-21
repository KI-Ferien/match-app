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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackData(signs);
      return { statusCode: 200, headers, body: JSON.stringify(fallback) };
    }

    const today = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Du bist ein weltgewandter Weltenbummler mit jahrzehntelanger Reiseerfahrung, ein feinfühliger Menschenkenner, ein versierter Reiseexperte und zugleich ein spiritueller Erleuchtender, der astrologisches Wissen mit echter Reise-Expertise verbindet. Du sprichst mit der Warmherzigkeit und Weisheit eines Menschen, der selbst schon an all diesen Orten war. /astro
    Heutiges Datum: ${today}.
    Analysiere folgende Parameter für ${participants} Personen der Sternzeichen ${signs}:
    Erlebnis-Wunsch: ${vibe}
    Budget-Pfad: ${budget}
    Gewünschte Entfernung: ${distance}
    Art der Fortbewegung: ${transport}
    
    WICHTIGE REGELN FÜR DEINE EMPFEHLUNG:

    1. ASTROLOGISCHE TIEFE: Verknüpfe die typischen Charaktereigenschaften der genannten Sternzeichen inhaltlich und konkret mit dem gewählten Ferienziel. Keine oberflächliche Erwähnung des Sternzeichens - die Verbindung muss nachvollziehbar und stimmig sein.

    2. GRUPPENDYNAMIK (PFLICHT, NICHT OPTIONAL): Mindestens EINES der 3 Packliste-Items MUSS die Personenzahl explizit im Namen tragen, z.B. bei ${participants} Personen: "${participants}x Wanderschuhe (individuell)" oder "${participants}x leichte Regenjacken" oder "Gemeinsames Picknick-Set für ${participants} Personen". Prüfe das aktiv, bevor du antwortest - ein Item ganz ohne Personenbezug ist ein Fehler.

    3. GEOGRAFISCHE BINDUNG: "Heimatliche Gefilde" bedeutet ZWINGEND Deutschland, mit Schwerpunkt auf Regionen nahe Hessen/Rheinland-Pfalz/Odenwald. "Nachbarreiche" bedeutet ZWINGEND DACH-Region plus direkt angrenzende Länder (auch weiter entfernte deutsche Regionen sind hier erlaubt). "Kontinentale Weite" bedeutet ZWINGEND Europa. "Ans Ende der Welt" bedeutet weltweit.

    4. REGIONEN-POOL: Du MUSST dein Ziel AUSSCHLIESSLICH aus der folgenden Liste wählen, passend zur gewählten Distanz-Stufe. KEINE Ausnahmen, KEINE eigenen Ziele außerhalb dieser Listen - auch wenn ein Sternzeichen (z.B. Schütze) thematisch zu Fernweh/Abenteuer/Bergen neigt, wähle in diesem Fall das abenteuerlichste/sportlichste Ziel AUS DER LISTE (z.B. Nibelungensteig oder Schwarzwald für "Heimatliche Gefilde"), NIEMALS ein Ziel außerhalb Deutschlands bei "Heimatliche Gefilde".

    Für "Heimatliche Gefilde" (Deutschland, Schwerpunkt Hessen/Rheinland-Pfalz/Odenwald-Nähe), wähle bevorzugt aus:
    Nibelungensteig (Odenwald), Alemannenweg (Odenwald/Bergstraße), Burgensteig Bergstraße (Darmstadt-Heidelberg),
    Rheingau, Mosel, Eifel, Vulkaneifel, Schwarzwald, Fränkische Schweiz, Bergstraße-Odenwald allgemein.

    Für "Nachbarreiche" (DACH gesamt + Frankreich/Schweiz/Österreich), wähle bevorzugt aus:
    Bodensee, Allgäu, Allgäuer Seenland, Bayerischer Wald, Sauerland, Spreewald, Harz,
    Ostseeküste (Rügen/Usedom), Nordseeküste (Sylt/Ostfriesland), Lüneburger Heide, Chiemgau,
    Fichtelgebirge, Schwäbische Alb, Teutoburger Wald, Berchtesgadener Land, Elbsandsteingebirge/Sächsische Schweiz,
    Weserbergland, Ruhrgebiet, Insel Amrum/Föhr,
    Straßburg (Frankreich), Elsass allgemein (Frankreich),
    Salzburg (Österreich), Salzkammergut (Österreich), Tirol (Österreich),
    Berner Oberland (Schweiz), Luzern und Vierwaldstättersee (Schweiz), Zürichsee (Schweiz), Appenzell (Schweiz), Graubünden/Engadin (Schweiz).

    Für "Kontinentale Weite" (Europa), wähle bevorzugt aus:
    Toskana, Lissabon, Wien, Amalfiküste, Griechische Inseln, Côte d'Azur,
    sowie italienische Wellness-/Thermenregionen für ruhige, entspannungsorientierte Anfragen.

    Für "Ans Ende der Welt" (weltweit), erwäge auch:
    Kanada (Rocky Mountains, Nationalparks, Wildnis) für abenteuerlustige, naturverbundene Anfragen.

    5. BUDGET-REALISMUS: Die Budget-Stufe "${budget}" MUSS sich glaubwürdig sowohl in der Art des Ziels/der Aktivitäten als auch in der Packliste widerspiegeln:
    - "Bescheidene Genügsamkeit": einfache, zweckmäßige Ausrüstung, unprätentiöse Ziele/Regionen
    - "Goldene Mitte": gute Qualität, ausgewogener Komfort
    - "Königlicher Luxus": hochwertige, exklusive Ausrüstung, gehobene Ziele/Regionen

    6. SAISONALITÄT: Der "bestTimeTip" muss zum tatsächlichen heutigen Datum (${today}) passen - empfehle keine Jahreszeiten-Aktivitäten, die zur aktuellen Jahreszeit nicht sinnvoll sind.

    7. VARIANZ: Vermeide es, bei ähnlichen Eingaben immer exakt dasselbe Ziel zu nennen - nutze die Bandbreite des Regionen-Pools.

    8. Die Packliste MUSS GENAU 3 REALE, hochprofessionelle Ausrüstungsgegenstände enthalten (skaliert nach Personenzahl, siehe Punkt 2). NENNE KEINE KAMERAS UNTER KEINEN UMSTÄNDEN. Nenne stattdessen exklusives Premium-Gepäck, High-Tech Kleidung oder Gadgets. ERFINDE KEINE esoterischen Gegenstände.

    9. Die Begründung ('explanation') MUSS ZWINGEND diese Quellen einbinden: 
       - Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973).
       - Das Konzept des Atman (Hinduismus, Merriam-Webster 2003).

    10. Nutze immer das Wort "Ferien".
    11. Beachte simulierte Reise- und Sicherheitswarnungen.

    PRÜFE VOR DER AUSGABE: Enthält die Packliste genau 3 Items, skaliert nach ${participants} Personen? Ist keine Kamera dabei? Ist das Ziel nicht das zuletzt naheliegendste (z.B. nicht immer Straßburg)?
    
    UNBEDINGTE JSON-STRUKTUR:
    - destination: Der klangvolle Ferienort oder Name der Ferienregion auf Deutsch für das Display (z.B. "Schwarzwald", "Istrien", "Toskana").
    - welcome_pickups_city: AUSSCHLIESSLICH die für diese Region optimale Flughafen- oder Ankunftsstadt von Welcome Pickups komplett in Kleinbuchstaben, ohne Sonderzeichen (z.B. statt "Schwarzwald" nimmst du "stuttgart", statt "Istrien" nimmst du "pula", statt "Toskana" nimmst du "pisa").
    
    Antworte AUSSCHLIESSLICH als JSON-Objekt ohne Markdown, ohne Präambel, ohne Erklärung:
    {
      "destination": "Schwarzwald",
      "welcome_pickups_city": "stuttgart",
      "explanation": "Tiefgründige, persönliche Begründung im Ton eines weltgewandten, spirituellen Reiseexperten, inkl. Sternzeichen, Gruppendynamik, Buddha (Yamamoto 1973) und Atman (Webster 2003).",
      "bestTimeTip": "Beste Reisezeit passend zum aktuellen Datum",
      "packliste": ["Reales Profi-Item 1", "Reales Profi-Item 2", "Reales Profi-Item 3"],
      "cta_text": "Ferien Erlebnisse buchen"
    }`;

    if (typeof globalThis.fetch !== 'function') {
      return { statusCode: 200, headers, body: JSON.stringify(getFallbackData(signs)) };
    }

    const claudeRes = await globalThis.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!claudeRes.ok) throw new Error(`API error ${claudeRes.status}`);

    const claudeData = await claudeRes.json();

    let rawText = claudeData.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim();
    
    const backtickPattern = '\\x60\\x60\\x60';
    const fenceRegex = new RegExp(`${backtickPattern}(?:json)?\\s*([\\s\\S]*?)\\s*${backtickPattern}`, 'i');
    const fenceMatch = rawText.match(fenceRegex);

    if (fenceMatch && fenceMatch[1]) rawText = fenceMatch[1].trim();
    if (!rawText.startsWith('{')) {
      const firstJson = rawText.match(/\{[\s\S]*?\}/);
      if (firstJson) rawText = firstJson[0];
    }

    const parsed = JSON.parse(rawText);

    // SERVERSEITIGE VALIDIERUNG: mehrere Pflicht-Kriterien gleichzeitig prüfen
    const heimatlichPool = ["Nibelungensteig", "Alemannenweg", "Burgensteig Bergstraße", "Rheingau", "Mosel", "Eifel", "Vulkaneifel", "Schwarzwald", "Fränkische Schweiz", "Bergstraße-Odenwald"];
    const nachbarreichePool = ["Bodensee", "Allgäu", "Bayerischer Wald", "Sauerland", "Spreewald", "Harz", "Ostseeküste", "Rügen", "Usedom", "Nordseeküste", "Sylt", "Ostfriesland", "Lüneburger Heide", "Chiemgau", "Fichtelgebirge", "Schwäbische Alb", "Teutoburger Wald", "Berchtesgadener Land", "Elbsandsteingebirge", "Sächsische Schweiz", "Weserbergland", "Ruhrgebiet", "Amrum", "Föhr", "Straßburg", "Elsass", "Salzburg", "Salzkammergut", "Tirol", "Berner Oberland", "Luzern", "Vierwaldstättersee", "Zürichsee", "Appenzell", "Graubünden", "Engadin"];

    const relevantPool = distance === "Heimatliche Gefilde" ? heimatlichPool
                        : distance === "Nachbarreiche" ? [...heimatlichPool, ...nachbarreichePool]
                        : null;

    const issues = [];

    if (relevantPool) {
      const destLower = (parsed.destination || '').toLowerCase();
      const isValidDestination = relevantPool.some(place => destLower.includes(place.toLowerCase()) || place.toLowerCase().includes(destLower));
      if (!isValidDestination) {
        issues.push(`Das Ziel "${parsed.destination}" ist NICHT im erlaubten Pool. Erlaubt sind AUSSCHLIESSLICH: ${relevantPool.join(', ')}. Wähle stattdessen zwingend eines davon.`);
      }
    }

    const explanationText = (parsed.explanation || '').toLowerCase();
    if (!explanationText.includes('yamamoto')) {
      issues.push(`Die Begründung enthält NICHT das Pflicht-Zitat "Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973)". Füge es zwingend ein.`);
    }
    if (!explanationText.includes('atman') || !explanationText.includes('webster')) {
      issues.push(`Die Begründung enthält NICHT die Pflicht-Referenz zum Konzept des Atman (Hinduismus, Merriam-Webster 2003). Füge sie zwingend ein.`);
    }

    if (issues.length > 0) {
      const correctionPrompt = `Deine vorherige Antwort hatte folgende Mängel, die du jetzt beheben musst:
      ${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n      ')}

      Erstelle die komplette JSON-Antwort erneut, im selben Ton und Stil wie zuvor (weltgewandter Weltenbummler, Menschenkenner, Reiseexperte, spiritueller Erleuchtender), für ${participants} Personen der Sternzeichen ${signs}, Vibe "${vibe}", Budget "${budget}", Distanz "${distance}".
      Behebe ALLE genannten Mängel gleichzeitig.
      Antworte AUSSCHLIESSLICH als JSON-Objekt ohne Markdown, exakt in der Struktur:
      {
        "destination": "...",
        "welcome_pickups_city": "...",
        "explanation": "...",
        "bestTimeTip": "...",
        "packliste": ["...", "...", "..."],
        "cta_text": "Ferien Erlebnisse buchen"
      }`;

      const correctionRes = await globalThis.fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: correctionPrompt }]
        })
      });

      if (correctionRes.ok) {
        const correctionData = await correctionRes.json();
        let correctionText = correctionData.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('')
          .trim();

        const correctionFenceMatch = correctionText.match(fenceRegex);
        if (correctionFenceMatch && correctionFenceMatch[1]) correctionText = correctionFenceMatch[1].trim();
        if (!correctionText.startsWith('{')) {
          const firstJson = correctionText.match(/\{[\s\S]*?\}/);
          if (firstJson) correctionText = firstJson[0];
        }

        try {
          const correctedParsed = JSON.parse(correctionText);
          return { statusCode: 200, headers, body: JSON.stringify(correctedParsed) };
        } catch (correctionParseError) {
          // Falls Korrektur-Parsing fehlschlägt, ursprüngliche Antwort trotzdem ausliefern statt Fehler zu werfen
        }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    
  } catch (apiError) {
    return { statusCode: 200, headers, body: JSON.stringify(getFallbackData('Widder')) };
  }
};
