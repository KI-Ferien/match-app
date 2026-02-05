/**
 * match.js - KI-Ferien.de
 * Steuert die dynamische UI und die kosmische Ferien-Analyse
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Initialisierung bei Seitenstart
document.addEventListener('DOMContentLoaded', () => {
    const personCountSelect = document.getElementById('personCount');
    if (personCountSelect) {
        // Erzeuge initiale Karten (Standard: 2 Personen)
        renderParticipantCards(personCountSelect.value);
        
        // Event Listener für Änderungen der Personenanzahl
        personCountSelect.addEventListener('change', (e) => {
            renderParticipantCards(e.target.value);
        });
    }

    const matchButton = document.getElementById('matchButton');
    if (matchButton) {
        matchButton.addEventListener('click', startCosmicAnalysis);
    }
});

/**
 * Erzeugt die Eingabekarten für die Teilnehmer basierend auf der Auswahl
 */
function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;

    container.innerHTML = ''; // Container leeren

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card aura-card';
        card.innerHTML = `
            <h3>Reisende(r) ${i}</h3>
            <div class="input-group">
                <label>Sternzeichen:</label>
                <select class="participant-zodiac">
                    ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
            </div>
            <div class="input-group">
                <label>Gefühltes Alter:</label>
                <input type="number" class="participant-age" value="25" min="1" max="120">
            </div>
        `;
        container.appendChild(card);
    }
}

/**
 * Sammelt die Daten und startet die Analyse über die Netlify Function
 */
async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    
    // Daten aus den Karten sammeln
    const zodiacElements = document.querySelectorAll('.participant-zodiac');
    const ageElements = document.querySelectorAll('.participant-age');
    
    const participants = [];
    zodiacElements.forEach((el, index) => {
        participants.push({
            zodiac: el.value,
            age: ageElements[index].value
        });
    });

    // UI-Feedback für die Analyse
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Analyse läuft...";
    resultDiv.innerHTML = `<p class="loading">Die KI berechnet eure kosmischen Feriensynergien...</p>`;

    try {
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');

        const data = await response.json();

        // Ergebnis anzeigen
        resultDiv.innerHTML = `
            <div class="analysis-box">
                <h2>Eure Kosmische Ferien-Analyse</h2>
                <div class="recommendation-text">${data.recommendation}</div>
            </div>
        `;
        
        // Zum Ergebnis scrollen
        resultDiv.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Fehler bei der Analyse:', error);
        resultDiv.innerHTML = `<p class="error">Der Kosmos ist gerade getrübt. (Fehler: ${error.message})</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
