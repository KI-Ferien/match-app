/**
 * match.js - KI-Ferien.de
 * Version: 1.0 (Stable)
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    // Korrekten Seitentitel setzen
    document.title = "KI-Ferien.de | Kosmische Ferien-Analyse";
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    // Initialer Aufbau der Teilnehmer-Karten
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
        // Styling direkt im JS für maximale Unabhängigkeit von CSS-Ladefehlern
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white; flex: 1 1 250px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);";
        
        card.innerHTML = `
            <h3 style="margin:0 0 15px 0; color:#ffd700;">Reisende(r) ${i}</h3>
            <div style="margin-bottom:15px;">
                <label style="font-size: 0.85rem; display:block; margin-bottom:5px; opacity:0.9;">Sternzeichen:</label>
                <select class="participant-zodiac" style="width:100%; padding:10px; border-radius:8px; border:none; background:white; color:black; font-weight:bold;">
                    ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="font-size: 0.85rem; display:block; margin-bottom:5px; opacity:0.9;">Gefühltes Alter:</label>
                <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:10px; border-radius:8px; border:none; background:white; color:black; font-weight:bold;">
            </div>
        `;
        container.appendChild(card);
    }
}

async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    if (!btn || !resultDiv) return;

    // Daten aus den Karten sammeln
    const participants = [];
    const zodiacs = document.querySelectorAll('.participant-zodiac');
    const ages = document.querySelectorAll('.participant-age');

    zodiacs.forEach((z, i) => {
        participants.push({
            zodiac: z.value,
            age: ages[i].value
        });
    });

    // UI Feedback während der Analyse
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Die Sterne werden befragt...";
    resultDiv.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p style="color:#ffd700; font-style:italic; animation: pulse 2s infinite;">Kosmische Ferien-Energien werden berechnet...</p>
        </div>
    `;

    try {
        // Fetch an den virtuellen API-Endpunkt (wird durch netlify.toml auf /netlify/functions/match umgeleitet)
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) {
            throw new Error(`Orakel-Status: ${response.status}`);
        }

        const data = await response.json();

        // Ergebnis-Box anzeigen
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:30px; border-radius:20px; color:white; margin-top:30px; border:1px solid #ffd700; box-shadow: 0 0 25px rgba(255, 215, 0, 0.2); animation: slideUp 0.6s ease-out;">
                <h2 style="color:#ffd700; margin-top:0; border-bottom:1px solid rgba(255,215,0,0.3); padding-bottom:10px;">Eure Kosmische Analyse</h2>
                <div style="font-size:1.15rem; line-height:1.7; white-space:pre-wrap;">${data.recommendation}</div>
                <div style="margin-top:20px; font-size:0.9rem; opacity:0.7; text-align:right;">— Erstellt von der KI-Ferien-Astrologie</div>
            </div>
        `;

    } catch (error) {
        console.error("Analyse-Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff6b6b; padding:20px; background:rgba(255,0,0,0.1); border-radius:15px; border:1px solid #ff6b6b; margin-top:20px; text-align:center;">
                <strong>Kosmische Störung!</strong><br>
                Die Verbindung zum KI-Orakel wurde unterbrochen. Bitte prüfe deine Internetverbindung oder versuche es in wenigen Augenblicken erneut.
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// CSS-Animationen hinzufügen
const style = document.createElement('style');
style.innerHTML = `
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);
