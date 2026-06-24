/**
 * match.js - Hochglanz-Affiliate-Übergabe
 * Verarbeitet das Mistral-Ergebnis und öffnet Klook direkt mit dem Zielort
 */

const AffiliateConfig = {
    KLOOK: {
        baseUrl: "https://www.klook.com/de/search/",
        queryParam: "keyword=", // Klook benötigt 'keyword' für die interne Suche
        aid: "492044" // Deine Travelpayouts Projekt-ID
    }
};

/**
 * Erzeugt den dynamischen Deep-Link für die Partnerseite
 * @param {string} destination - Das von der KI gefundene Ziel (z.B. "Strassburg")
 * @returns {string} - Der fertige Affiliate-Link mit Suchbegriff
 */
function generatePartnerLink(destination) {
    if (!destination) return "#";
    
    const config = AffiliateConfig.KLOOK;
    
    // encodeURIComponent sorgt dafür, dass Sonderzeichen/Leerzeichen die URL nicht zerschießen
    const encodedDestination = encodeURIComponent(destination.trim());
    
    // Setzt die URL zusammen: Basis + Suche + Zielort + Deine Affiliate-ID
    return `${config.baseUrl}?${config.queryParam}${encodedDestination}&aid=${config.aid}`;
}

/**
 * Liest das Ergebnis aus dem sessionStorage und bringt die UI auf Hochglanz
 */
function initMatchPage() {
    const container = document.getElementById('match-container'); // Falls dein Container so heißt
    
    try {
        // Daten aus dem Orakel-SessionStorage holen
        const rawData = sessionStorage.getItem('orakelResult');
        if (!rawData) {
            console.warn("Keine Orakel-Daten im Speicher gefunden.");
            return;
        }

        const parsed = JSON.parse(rawData);
        // Flexibler Zugriff, falls die Struktur verschachtelt ist (z.B. parsed.result)
        const data = parsed.result || parsed; 

        if (data && data.destination) {
            const destination = data.destination;
            const description = data.description || "";
            
            // Generiere den exakten Klook-Suchlink für dieses Ziel
            const klookAffiliateUrl = generatePartnerLink(destination);

            // Hier wird deine reise.html dynamisch befüllt
            // Der Button leitet direkt auf die Klook-Suche weiter!
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

// Startet die Logik, sobald die reise.html geladen ist
document.addEventListener('DOMContentLoaded', initMatchPage);
