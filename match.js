/**
 * match.js - Korrigierte Affiliate-Übergabe für Klook & Travelpayouts
 */

const AffiliateConfig = {
    KLOOK: {
        // Die korrekte URL für externe Suchanfragen lautet /search-result/
        baseUrl: "https://www.klook.com/de/search-result/",
        queryParam: "query=", // Klook erwartet extern 'query' statt 'keyword'
        aid: "492044" // Deine Travelpayouts Projekt-ID
    }
};

/**
 * Erzeugt den funktionierenden Such-Link für Klook
 * @param {string} destination - Das von Mistral gefundene Ziel (z.B. "Strassburg")
 * @returns {string} - Der fertige Affiliate-Link
 */
function generatePartnerLink(destination) {
    if (!destination) return "#";
    
    const config = AffiliateConfig.KLOOK;
    
    // Wichtig: Klook benötigt für die Suche oft das reine Pluszeichen bei Leerzeichen
    // Wir bereinigen den String und codieren ihn absolut URL-sicher
    const cleanedDestination = destination.trim();
    const encodedDestination = encodeURIComponent(cleanedDestination);
    
    // Zusammensetzen der funktionierenden Struktur für Klook + Travelpayouts-Parameter
    return `${config.baseUrl}?${config.queryParam}${encodedDestination}&aid=${config.aid}`;
}

/**
 * Liest das Ergebnis aus dem sessionStorage und befüllt die reise.html
 */
function initMatchPage() {
    const container = document.getElementById('match-container');
    
    try {
        const rawData = sessionStorage.getItem('orakelResult');
        if (!rawData) {
            console.warn("Keine Orakel-Daten im Speicher gefunden.");
            return;
        }

        const parsed = JSON.parse(rawData);
        const data = parsed.result || parsed; 

        if (data && data.destination) {
            const destination = data.destination;
            const description = data.description || "";
            
            // Generiere den geprüften Klook-Suchlink
            const klookAffiliateUrl = generatePartnerLink(destination);

            if (container) {
                container.innerHTML = `
                    <div class="result-card fade-in">
                        <h2>Dein kosmisches Ziel: ${destination}</h2>
                        <p class="description">${description}</p>
                        <div class="action-area">
                            <a href="${klookAffiliateUrl}" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="btn-gold">
                               Ferien in ${destination} buchen
                            </a>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Fehler beim Verarbeiten des Reiseziels:", error);
    }
}

document.addEventListener('DOMContentLoaded', initMatchPage);
