/**
 * match.js - KI-Ferien.de
 * VERSION: 16.0 - TOML-SYNTAX-FIX-CONFIRMED
 */

// Sofortiger Check für dich im Browser-Tab
document.title = "V16: KI-Ferien Aktiv";

console.log("%c ✨ SYSTEM-RECOVERY V16: TOML-Fix wird angewendet...", "color: #fff; background: #3498db; font-size: 20px; padding: 10px;");

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    // Titel erneut setzen für maximale Sicherheit
    document.title = "KI-Ferien.de | Kosmische Ferien-Analyse";
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
    }

    if (matchButton) {
        // Wir stellen sicher, dass nur ein Listener aktiv ist
        matchButton.onclick = null;
        matchButton.addEventListener('click', startCosmicAnalysis);
    }
});

function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'aura-card';
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white; flex: 1 1 200px;";
        
        card.innerHTML = `
            <h3>Person ${i}</h3>
            <label style="font-size: 0.8rem; opacity: 0.8; display:block;">Sternzeichen</label>
            <select class="participant-zodiac" style="width:100%; padding:10px; margin:5px 0 15px 0; border-radius:8px; color:black;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="font-size: 0.8rem; opacity: 0.8; display:block;">Gefühltes Alter</label>
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
    btn.innerHTML = "✨ Kosmos wird befragt...";
    resultDiv.innerHTML = "<p style='color: #ffd700; text-align:center;'>Verbindung zur Mistral-KI wird aufgebaut...</p>";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error(`Netlify Error: ${response.status}`);
        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:25px; border-radius:20px; color:white; margin-top:30px; border:1px solid #ffd700;">
                <h2 style="color:#ffd700; margin-top:0; text-align:center;">Eure Kosmische Analyse</h2>
                <div style="font-size:1.1rem; line-height:1.6; white-space:pre-wrap;">${data.recommendation}</div>
            </div>`;
    } catch (error) {
        console.error("Fehler:", error);
        resultDiv.innerHTML = `<div style="color:#ff6b6b; text-align:center; padding:20px; border:1px solid #ff6b6b; border-radius:10px;">
            <strong>Analyse fehlgeschlagen.</strong><br>Grund: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Kosmische Ferien-Analyse starten";
    }
}
