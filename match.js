function getFallbackData(signs) {
  return {
    destination: "Schwarzwald",
    welcome_pickups_city: "stuttgart",
    explanation: `Das Orakel ruht gerade mangels API-Schlüssel lokal im Labor. Dies ist eine astrologische Resonanz für die Sternzeichen ${signs || 'Keine'} für deine Ferien. Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973), liegt wahres Glück in der bewussten Einkehr. Das Konzept des Atman (Hinduismus, Merriam-Webster 2003) spiegelt sich in den majestätischen Wipfeln des Waldes wider.`,
    bestTimeTip: "Mai bis September",
    packliste: ["2x Premium-Wanderschuhe (individuell angepasst)", "Winddichte Softshelljacke", "Stilvolles Reisetagebuch"],
    cta_text: "Ferien Erlebnisse buchen"
  };
}

const MODEL = "claude-sonnet-5";
const MAX_ATTEMPTS = 3; // 1 Erstversuch + bis zu 2 geprüfte Korrekturrunden

const HEIMATLICH_POOL = ["Nibelungensteig", "Alemannenweg", "Burgensteig Bergstraße", "Rheingau", "Mosel", "Eifel", "Vulkaneifel", "Schwarzwald", "Fränkische Schweiz"];
const NACHBARREICHE_POOL = ["Bodensee", "Allgäu", "Bayerischer Wald", "Sauerland", "Spreewald", "Harz", "Ostseeküste", "Nordseeküste", "Lüneburger Heide", "Chiemgau", "Fichtelgebirge", "Schwäbische Alb", "Teutoburger Wald", "Berchtesgadener Land", "Sächsische Schweiz", "Weserbergland", "Ruhrgebiet", "Straßburg", "Salzburg", "Salzkammergut", "Tirol", "Berner Oberland", "Luzern", "Zürichsee", "Appenzell", "Graubünden"];
const KONTINENTALE_WEITE_POOL = ["Toskana", "Lissabon", "Wien", "Amalfiküste", "Griechische Inseln", "Côte d'Azur"];
const ANS_ENDE_DER_WELT_POOL = ["Kanada"];

const CITY_MAP = {
  "nibelungensteig": "frankfurt", "alemannenweg": "frankfurt", "burgensteig bergstraße": "frankfurt",
  "rheingau": "frankfurt", "mosel": "frankfurt-hahn", "eifel": "frankfurt-hahn", "vulkaneifel": "frankfurt-hahn",
  "schwarzwald": "stuttgart", "fränkische schweiz": "nuernberg",
  "bodensee": "friedrichshafen", "allgäu": "memmingen", "bayerischer wald": "muenchen", "sauerland": "dortmund",
  "spreewald": "berlin", "harz": "hannover", "ostseeküste": "rostock", "nordseeküste": "hamburg",
  "lüneburger heide": "hamburg", "chiemgau": "muenchen", "fichtelgebirge": "nuernberg", "schwäbische alb": "stuttgart",
  "teutoburger wald": "paderborn", "berchtesgadener land": "salzburg", "sächsische schweiz": "dresden",
  "weserbergland": "hannover", "ruhrgebiet": "dortmund", "straßburg": "strasbourg", "salzburg": "salzburg",
  "salzkammergut": "salzburg", "tirol": "innsbruck", "berner oberland": "bern", "luzern": "zuerich",
  "zürichsee": "zuerich", "appenzell": "zuerich", "graubünden": "zuerich",
  "toskana": "pisa", "lissabon": "lissabon", "wien": "wien", "amalfiküste": "neapel",
  "griechische inseln": "athen", "côte d'azur": "nizza", "kanada": "toronto"
};

function getCityForDestination(destName) {
  if (!destName) return "frankfurt";
  const destLower = destName.toLowerCase();
  for (const [key, val] of Object.entries(CITY_MAP)) {
    if (destLower.includes(key) || key.includes(destLower)) {
      return val;
    }
  }
  return "frankfurt";
}

function getRelevantPool(distanceNormalized) {
  if (distanceNormalized === "heimatliche gefilde") return HEIMATLICH_POOL;
  if (distanceNormalized === "nachbarreiche") return [...HEIMATLICH_POOL, ...NACHBARREICHE_POOL];
  if (distanceNormalized === "kontinentale weite") return KONTINENTALE_WEITE_POOL;
  if (distanceNormalized === "ans ende der welt") return ANS_ENDE_DER_WELT_POOL;
  return HEIMATLICH_POOL;
}

// Extrahiert JSON aus der Modell-Antwort (auch wenn in ```-Fences oder mit Prosa drumherum)
function extractJson(rawText) {
  let text = rawText.trim();
  const backtickPattern = '\\x60\\x60\\x60';
  const fenceRegex = new RegExp(`${backtickPattern}(?:json)?\\s*([\\s\\S]*?)\\s*${backtickPattern}`, 'i');
  const fenceMatch = text.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) text = fenceMatch[1].trim();
  if (!text.startsWith('{')) {
    const firstJson = text.match(/\{[\s\S]*?\}/);
    if (firstJson) text = firstJson[0];
  }
  return JSON.parse(text);
}

async function callClaude(apiKey, promptText) {
  const res = await globalThis.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: promptText }]
    })
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  const rawText = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim();

  return extractJson(rawText);
}

// Prüft alle "PFLICHT"-Regeln aus dem Prompt serverseitig. Gibt die verletzten Regeln
// als Liste zurück, damit gezielt (statt pauschal) nachkorrigiert werden kann.
function validate(parsed, participants, distanceNormalized) {
  const issues = [];
  let forcedDestination = null;

  const relevantPool = getRelevantPool(distanceNormalized);
  const destLower = (parsed.destination || '').toLowerCase();
  const isValidDestination = relevantPool.some(place => destLower.includes(place.toLowerCase()) || place.toLowerCase().includes(destLower));
  if (!isValidDestination) {
    forcedDestination = relevantPool[Math.floor(Math.random() * relevantPool.length)];
    issues.push(`Das Ziel ist jetzt fest vorgegeben: "${forcedDestination}". Schreibe die Begründung und Packliste passend zu genau diesem Ziel neu.`);
  }

  const explanationText = (parsed.explanation || '').toLowerCase();
  if (!explanationText.includes('yamamoto')) {
    issues.push(`Die Begründung muss das Pflicht-Zitat "Wie Buddha es im Mahayana im Mahapäriniviranä Sutra erläutert (Übersetzer Kosho Yamamoto 1973)" enthalten.`);
  }
  if (!explanationText.includes('atman') || !explanationText.includes('webster')) {
    issues.push(`Die Begründung muss die Pflicht-Referenz zum Konzept des Atman (Hinduismus, Merriam-Webster 2003) enthalten.`);
  }

  const packliste = Array.isArray(parsed.packliste) ? parsed.packliste : [];

  if (packliste.length !== 3) {
    issues.push(`Die Packliste muss GENAU 3 Einträge enthalten (aktuell: ${packliste.length}). Fasse auf exakt 3 reale, hochprofessionelle Ausrüstungsgegenstände zusammen bzw. ergänze auf 3, ohne die Qualität zu verwässern.`);
  }

  const packText = packliste.join(' ').toLowerCase();
  if (packText.includes('kamera') || packText.includes('camera')) {
    issues.push(`Die Packliste darf KEINE Kameras enthalten.`);
  }

  const hasParticipantRef = packliste.some(item => {
    const itemLower = item.toLowerCase();
    return itemLower.includes(`${participants}x`) ||
           itemLower.includes(`${participants} `) ||
           itemLower.includes(`für ${participants}`) ||
           itemLower.includes(`${participants} personen`);
  });

  if (!hasParticipantRef && packliste.length > 0) {
    issues.push(`Mindestens ein Gegenstand in der Packliste MUSS explizit auf die Personenzahl (${participants} Personen) Bezug nehmen (z.B. "${participants}x Wanderschuhe (individuell)").`);
  }

  return { issues, forcedDestination };
}

function buildCorrectionPrompt(issues, forcedDestination, parsed, participants, signs, vibe, budget) {
  return `Überarbeite die folgende Ferien-Empfehlung, um diese Punkte zu beheben:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

${forcedDestination ? `WICHTIG: Das Ziel "${forcedDestination}" ist FEST und darf nicht geändert werden.` : ''}
Behalte Ton und Stil bei (weltgewandter Weltenbummler, Menschenkenner, Reiseexperte, spiritueller Erleuchtender), für ${participants} Personen der Sternzeichen ${signs}, Vibe "${vibe}", Budget "${budget}".
Antworte AUSSCHLIESSLICH als JSON-Objekt ohne Markdown, exakt in der Struktur:
{
  "destination": "${forcedDestination || parsed.destination || 'Schwarzwald'}",
  "welcome_pickups_city": "${getCityForDestination(forcedDestination || parsed.destination)}",
  "explanation": "...",
  "bestTimeTip": "...",
  "packliste": ["...", "...", "..."],
  "cta_text": "Ferien Erlebnisse buchen"
}`;
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
    const signs = Array.isArray(payload.signs) ? payload.signs.join(', ') : (payload.signs || 'Keine spezifischen');
    const participants = Number(payload.participants) || 2;
    const vibe = payload.vibe || 'Fließende Balance';
    const budget = payload.budget || 'Goldene Mitte';
    const distance = payload.distance || 'Nachbarreiche';
    const transport = payload.transport || 'Flug der Falken';

    console.log('DEBUG - Empfangene Parameter:', JSON.stringify({ signs, participants, vibe, budget, distance, transport }));

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const fallback = getFallbackData(signs);
      return { statusCode: 200, headers, body: JSON.stringify(fallback) };
    }

    if (typeof globalThis.fetch !== 'function') {
      return { statusCode: 200, headers, body: JSON.stringify(getFallbackData(signs)) };
    }

    const today = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

    const initialPrompt = `Du bist ein weltgewandter Weltenbummler mit jahrzehntelanger Reiseerfahrung, ein feinfühliger Menschenkenner, ein versierter Reiseexperte und zugleich ein spiritueller Erleuchtender, der astrologisches Wissen mit echter Reise-Expertise verbindet. Du sprichst mit der Warmherzigkeit und Weisheit eines Menschen, der selbst schon an all diesen Orten war. /astro
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
    Nibelungensteig (Odenwald), Alemannenweg (Odenwald/Bergstraße), Burgensteig Bergstraße (Darmstadt-Heidelberg), Rheingau, Mosel, Eifel, Vulkaneifel, Schwarzwald, Fränkische Schweiz, Bergstraße-Odenwald allgemein.

    Für "Nachbarreiche" (DACH gesamt + Frankreich/Schweiz/Österreich), wähle bevorzugt aus:
    Bodensee, Allgäu, Allgäuer Seenland, Bayerischer Wald, Sauerland, Spreewald, Harz, Ostseeküste (Rügen/Usedom), Nordseeküste (Sylt/Ostfriesland), Lüneburger Heide, Chiemgau, Fichtelgebirge, Schwäbische Alb, Teutoburger Wald, Berchtesgadener Land, Elbsandsteingebirge/Sächsische Schweiz, Weserbergland, Ruhrgebiet, Insel Amrum/Föhr, Straßburg (Frankreich), Elsass allgemein (Frankreich), Salzburg (Österreich), Salzkammergut (Österreich), Tirol (Österreich), Berner Oberland (Schweiz), Luzern und Vierwaldstättersee (Schweiz), Zürichsee (Schweiz), Appenzell (Schweiz), Graubünden/Engadin (Schweiz).

    Für "Kontinentale Weite" (Europa), wähle bevorzugt aus:
    Toskana, Lissabon, Wien, Amalfiküste, Griechische Inseln, Côte d'Azur, sowie italienische Wellness-/Thermenregionen für ruhige, entspannungsorientierte Anfragen.

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

    const distanceNormalized = (distance || '').trim().toLowerCase();
    let currentPromptText = initialPrompt;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let parsed;
      try {
        parsed = await callClaude(apiKey, currentPromptText);
      } catch (callError) {
        console.log(`DEBUG - Versuch ${attempt}: Claude-Aufruf oder JSON-Parsing fehlgeschlagen:`, callError.message);
        if (attempt < MAX_ATTEMPTS) {
          // Meist ein abgeschnittenes JSON (Antwort zu lang) - nochmal mit Hinweis auf Kürze versuchen,
          // statt sofort komplett aufzugeben.
          currentPromptText = `${initialPrompt}\n\nWICHTIG: Deine letzte Antwort war unvollständig/kein gültiges JSON. Fasse dich in "explanation" etwas kürzer (max. 4-5 Sätze) und gib ausschließlich das vollständige, valide JSON-Objekt zurück, ohne es abzuschneiden.`;
          continue;
        }
        break; // Letzter Versuch ebenfalls fehlgeschlagen -> unten Fallback ausliefern
      }

      const { issues, forcedDestination } = validate(parsed, participants, distanceNormalized);

      if (forcedDestination) parsed.destination = forcedDestination;
      parsed.welcome_pickups_city = getCityForDestination(parsed.destination);

      console.log(`DEBUG - Versuch ${attempt}: Ziel="${parsed.destination}", Issues=${issues.length}`, issues);

      if (issues.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify(parsed) };
      }

      if (attempt < MAX_ATTEMPTS) {
        currentPromptText = buildCorrectionPrompt(issues, forcedDestination, parsed, participants, signs, vibe, budget);
      }
    }

    // Alle Versuche haben mindestens eine Pflichtregel verletzt (oder die API ist fehlgeschlagen):
    // Lieber die stimmungsvolle Fallback-Antwort ausliefern als ein regelwidriges Ergebnis.
    console.log('DEBUG - Alle Versuche unzureichend, liefere Fallback aus.');
    return { statusCode: 200, headers, body: JSON.stringify(getFallbackData(signs)) };

  } catch (apiError) {
    console.log('DEBUG - Unerwarteter Fehler:', apiError.message);
    return { statusCode: 200, headers, body: JSON.stringify(getFallbackData('Widder')) };
  }
};
