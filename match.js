/**
 * match.js - Das Herzstück für 'Das KI-Ferien Match'
 * Hochglanz-Version für Einzelvorschläge mit Affiliate-Logik
 */

const AffiliateConfig = {
    KLOOK: {
        baseUrl: "https://www.klook.com/de/search/",
        param: "query=",
        id: "492044" // Dein Travelpayouts Projekt ID
    },
    TUI: {
        baseUrl: "https://www.tui.com/search/",
        param: "destination=",
        id: "698672"
    }
};

/**
 * Erzeugt einen sauberen Affiliate-Link
 * @param {string} destination - Das Ziel
 * @param {string} partner - 'KLOOK' oder 'TUI'
 */
function generateAffiliateLink(destination, partner) {
    const config = AffiliateConfig[partner];
    const encodedDest = encodeURIComponent(destination);
    // Hier wird die Affiliate-ID korrekt integriert
    return `${config.baseUrl}?${config.param}${encodedDest}&aid=${config.id}`;
}

/**
 * Hauptfunktion zur Generierung und Anzeige des Ferien-Matches
 * @param {Object} userData - Daten aus dem Formular/Sternzeichen/Slider
 */
async function generateFerienMatch(userData) {
    const container = document.getElementById('match-container');
    
    // 1. UI: Loading State aktivieren (Hochglanz-UX)
    container.innerHTML = `
        <div class="skeleton-card">
            <div class="spinner"></div>
            <p>Einen Moment, wir kuratieren deine perfekten Ferien...</p>
        </div>`;

    try {
        // Hier würde normalerweise der Fetch zu deinem KI-Endpunkt erfolgen
        // Simuliert: Daten-Objekt
        const suggestion = {
            destination: "Teneriffa", // Beispiel-Resultat der KI
            description: "Ein Ort, an dem das Licht des Südens mit deiner Krebs-Natur harmoniert.",
            imageUrl: "path/to/image.jpg"
        };

        // 2. UI: Ergebnis rendern
        container.innerHTML = `
            <div class="result-card fade-in">
                <img src="${suggestion.imageUrl}" alt="${suggestion.destination}" class="card-image">
                <h3>${suggestion.destination}</h3>
                <p>${suggestion.description}</p>
                <div class="action-buttons">
                    <a href="${generateAffiliateLink(suggestion.destination, 'KLOOK')}" 
                       target="_blank" class="btn-primary">Jetzt bei Klook entdecken</a>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p class="error">Die Verbindung zum Horizont war kurzzeitig gestört. Bitte versuche es erneut.</p>`;
        console.error("Fehler bei der Matching-Logik:", error);
    }
}

// Event Listener für die UI-Interaktion
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('search-trigger');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            // Beispielhafte User-Daten (Sternzeichen etc.)
            const userData = { sign: "Krebs", vibe: "entspannt" };
            generateFerienMatch(userData);
        });
    }
});
