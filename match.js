// match.js - KI-Ferien.de Backend Engine (Produktionsbereit v2.1)
// Bereinigt um Pickups, optimiert für In-App-Browser & App-Datums-UI

const ASTR_DATA = {
  widder: { name: "Widder", von: "21. März", bis: "19. April", symbol: "♈", element: "Feuer" },
  stier: { name: "Stier", von: "20. April", bis: "20. Mai", symbol: "♉", element: "Erde" },
  zwillinge: { name: "Zwillinge", von: "21. Mai", bis: "21. Juni", symbol: "♊", element: "Luft" },
  krebs: { name: "Krebs", von: "22. Juni", bis: "22. Juli", symbol: "♋", element: "Wasser" },
  loewe: { name: "Löwe", von: "23. Juli", bis: "22. August", symbol: "♌", element: "Feuer" },
  jungfrau: { name: "Jungfrau", von: "23. August", bis: "22. September", symbol: "♍", element: "Erde" },
  waage: { name: "Waage", von: "23. September", bis: "23. Oktober", symbol: "♎", element: "Luft" },
  skorpion: { name: "Skorpion", von: "24. Oktober", bis: "22. November", symbol: "♏", element: "Wasser" },
  schuetze: { name: "Schütze", von: "23. November", bis: "21. Dezember", symbol: "♐", element: "Feuer" },
  steinbock: { name: "Steinbock", von: "22. Dezember", bis: "19. Januar", symbol: "♑", element: "Erde" },
  wassermann: { name: "Wassermann", von: "20. Januar", bis: "18. Februar", symbol: "♒", element: "Luft" },
  fische: { name: "Fische", von: "19. Februar", bis: "20. März", symbol: "♓", element: "Wasser" }
};

/**
 * Liefert die bereinigten UI-Daten für das App-Grid
 */
function getAstroUiDefinition(signKey) {
  const sign = ASTR_DATA[signKey.toLowerCase()];
  if (!sign) return null;

  return {
    symbol: sign.symbol,
    label: sign.name,
    dateRange: `${sign.von} – ${sign.bis}`, // Für die Anzeige direkt unter dem Symbol
    element: sign.element
  };
}

/**
 * Erstellt den geschärften Mistral-Prompt zur Vermeidung von Dopplungen
 */
function generateMistralPrompt(signKey, userPreferences = {}) {
  const sign = ASTR_DATA[signKey.toLowerCase()];
  if (!sign) throw new Error("Ungültiges Sternzeichen.");

  const elementFocus = {
    Feuer: "Physische Herausforderung, Pionier-Erlebnisse, weite Landschaften und absolute Dynamik.",
    Erde: "Natur-Resonanz, Entschleunigung, erdende Rückzugsorte und authentische Kulinarik.",
    Luft: "Kultureller Intellekt, urbane Vielfalt, Architektur und inspirierender Austausch.",
    Wasser: "Tiefe Reflexion, Küsten- oder Seenlandschaften, absolute Ruhe und emotionale Regeneration."
  };

  return `
Du bist die astrologische KI-Engine von KI-Ferien.de. Generiere eine maßgeschneiderte Reiseanalyse.
Sternzeichen: ${sign.name} (Element: ${sign.element})
Fokus: ${elementFocus[sign.element]}

STRIKTE ANTI-REDUNDANZ-REGELN:
1. Schlage NIEMALS Standard-Ziele ohne tiefen Bezug vor. Jede Destination muss exklusiv wirken.
2. Nutze keine oberflächlichen Klischees. Begründe die Auswahl psychologisch fundiert anhand des Elements (${sign.element}).
3. Vermeide Dopplungen zu vorherigen Abfragen.

Gib das Ergebnis zwingend als valides JSON-Objekt in folgendem Format zurück:
{
  "vibe_keynote": "Ein prägnanter Satz zum aktuellen Reise-Mantra.",
  "destinationen": [
    {
      "ort": "Stadt, Land",
      "astro_matching_grund": "Detaillierte, psychologische Begründung, warum dieser Ort das Element anspricht.",
      "partner_id": 492044,
      "link_type": "in_app_browser"
    }
  ]
}
`.trim();
}

module.exports = {
  getAstroUiDefinition,
  generateMistralPrompt,
  astroData: ASTR_DATA
};
