/**
 * match.js - KI-Ferien.de
 * Vollständige Logik für die Kosmische Ferien-Analyse
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kosmische Analyse geladen...");
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    // 1. Initialer Check & Aufbau
    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        
        personCountSelect.addEventListener('change', (e) => {
            renderParticipantCards(e.target.value);
        });
    }

    // 2. Button-Event verknüpfen
    if (matchButton) {
        matchButton.addEventListener('click', startCosmicAnalysis);
    } else {
        console.error("Button mit ID 'matchButton' nicht gefunden!");
    }
});

/**
 * Erzeugt die Eingabekarten (Glassmorphism Style)
 */
function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;

    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1.5rem;
            border-radius: 15px;
            margin: 10px;
            color: white;
            min-width: 200px;
        `;
        
        card.innerHTML = `
            <h3 style="margin-top:0">Reisende(r) ${i}</h3>
            <label style="display:block; margin-bottom:5px;">Sternzeichen</label>
            <select class="participant-zodiac" style="width:100%; padding:8px; border-radius:5px; margin-bottom:15px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="display:block; margin-bottom:5px;">Gefühltes Alter</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:5px;">
        `;
        container.appendChild(card);
    }
}

/**
 * Sendet die Daten an die Netlify Function
 */
async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    
    if (!btn || !resultDiv) return;

    // Daten sammeln
    const participants = [];
    const zodiacs = document.querySelectorAll('.participant-zodiac');
    const ages = document.querySelectorAll('.participant-age');

    zodiacs.forEach((z, i) => {
        participants.push({
            zodiac: z.value,
            age: ages[i].value
        });
    });

    // Feedback geben
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Analyse läuft...";
    resultDiv.innerHTML = "<p style='color: white;'>Die Sterne werden befragt... Bitte warten.</p>";

    try {
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error('API Fehler');

        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 15px; color: white; margin-top: 20px;">
                <h2 style="color: #ffd700;">Eure Kosmische Analyse</h2>
                <p style="line-height: 1.6;">${data.recommendation}</p>
            </div>
        `;

    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "<p style='color: #ff6b6b;'>Verbindung zum Kosmos unterbrochen. Prüfe deine Netlify Functions!</p>";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
