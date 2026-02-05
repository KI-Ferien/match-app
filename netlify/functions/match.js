/**
 * match.js - KI-Ferien.de
 * Optimiert für die Nutzung mit netlify.toml Redirects (/api/*)
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    console.log("Kosmische Ferien-Analyse initialisiert.");
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    // Initialer Aufbau der Karten
    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
    }

    if (matchButton) {
        matchButton.addEventListener('click', startCosmicAnalysis);
    }
});

function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'aura-card'; // Nutzt dein CSS
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white;";
        
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0;">Teilnehmer ${i}</h3>
            <label>Sternzeichen:</label>
            <select class="participant-zodiac" style="width:100%; padding:8px; margin:5px 0 15px 0; border-radius:5px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label>Gefühltes Alter:</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:5px;">
        `;
        container.appendChild(card);
    }
}

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

    // UI Feedback
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Analyse läuft...";
    resultDiv.innerHTML = "<p style='color:white; animation: pulse 2s infinite;'>Die KI berechnet eure kosmische Synergie...</p>";

    try {
        // WICHTIG: Nutzt jetzt den /api/ Pfad aus deiner netlify.toml
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server-Fehler: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.2); padding:25px; border-radius:20px; color:white; margin-top:30px; border:1px solid #ffd700;">
                <h2 style="color:#ffd700; margin-top:0;">Eure Kosmische Analyse</h2>
                <p style="font-size:1.1rem; line-height:1.6;">${data.recommendation}</p>
            </div>
        `;

    } catch (error) {
        console.error("Analyse-Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff6b6b; padding:20px; background:rgba(0,0,0,0.3); border-radius:10px;">
                <strong>Oje! Die Verbindung ist unterbrochen.</strong><br>
                Mögliche Ursache: Die Netlify Function wurde im Pfad <code>/netlify/functions/</code> nicht gefunden oder der API-Key fehlt.<br>
                <small>${error.message}</small>
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
