/**
 * match.js - KI-Ferien.de
 * Version: 3.0 - Fehler-Diagnose Edition
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    document.title = "KI-Ferien.de | Kosmische Ferien-Analyse";
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

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
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white; flex: 1 1 250px;";
        
        card.innerHTML = `
            <h3 style="margin:0 0 15px 0; color:#ffd700;">Reisende(r) ${i}</h3>
            <select class="participant-zodiac" style="width:100%; padding:10px; border-radius:8px; margin-bottom:15px; color:black;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:10px; border-radius:8px; color:black;">
        `;
        container.appendChild(card);
    }
}

async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    if (!btn || !resultDiv) return;

    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    btn.disabled = true;
    btn.innerHTML = "✨ Analyse läuft...";
    resultDiv.innerHTML = "<p style='color:#ffd700;'>Verbindung wird geprüft...</p>";

    try {
        // Pfad-Check: Wir rufen /api/match auf
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (response.status === 404) {
            throw new Error("Die API-Schnittstelle wurde nicht gefunden (404). Prüfe, ob die Datei 'netlify/functions/match.js' existiert.");
        }

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(`Server-Fehler (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:25px; border-radius:20px; color:white; border:1px solid #ffd700;">
                <h2 style="color:#ffd700;">Eure Analyse</h2>
                <p>${data.recommendation}</p>
            </div>`;

    } catch (error) {
        console.error("Detail-Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff6b6b; padding:20px; background:rgba(0,0,0,0.3); border-radius:15px; border:1px solid #ff6b6b;">
                <strong>Diagnose:</strong><br>${error.message}
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Ferien-Ziel berechnen";
    }
}
