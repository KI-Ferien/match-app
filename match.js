/**
 * match.js - KI-Ferien.de
 * Version: 2.0 (Stabil & Modern)
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
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white; flex: 1 1 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
        
        card.innerHTML = `
            <h3 style="margin:0 0 15px 0; color:#ffd700;">Reisende(r) ${i}</h3>
            <label style="font-size: 0.85rem; display:block; margin-bottom:5px;">Sternzeichen:</label>
            <select class="participant-zodiac" style="width:100%; padding:10px; border-radius:8px; border:none; margin-bottom:15px; background:white; color:black;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="font-size: 0.85rem; display:block; margin-bottom:5px;">Gefühltes Alter:</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:10px; border-radius:8px; border:none; background:white; color:black;">
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

    // UI-Zustand: Laden
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Sterne werden befragt...";
    
    // Smooth Scroll zum Ergebnis-Bereich
    resultDiv.innerHTML = "<div id='loading-aura' style='text-align:center; padding:40px;'><p style='color:#ffd700; font-style:italic; font-size:1.2rem; animation: pulse 1.5s infinite;'>Berechne eure kosmischen Ferien-Energien...</p></div>";
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();

        // Ergebnis präsentieren
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:35px; border-radius:25px; color:white; margin-top:30px; border:1px solid #ffd700; box-shadow: 0 0 30px rgba(255,215,0,0.2); animation: fadeInUp 0.8s ease-out;">
                <h2 style="color:#ffd700; margin-top:0; border-bottom:1px solid rgba(255,215,0,0.3); padding-bottom:10px;">Eure Kosmische Analyse</h2>
                <div style="font-size:1.2rem; line-height:1.8; white-space:pre-wrap; margin-top:15px;">${data.recommendation}</div>
                <div style="margin-top:25px; text-align:center;">
                    <button onclick="window.location.reload()" style="background:transparent; border:1px solid #ffd700; color:#ffd700; padding:10px 20px; border-radius:30px; cursor:pointer; font-size:0.9rem;">Neue Analyse starten</button>
                </div>
            </div>`;
    } catch (error) {
        resultDiv.innerHTML = `<div style="color:#ff6b6b; text-align:center; padding:30px; background:rgba(255,0,0,0.1); border-radius:20px; border:1px solid #ff6b6b;"><strong>Störung im Äther.</strong><br>Grund: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Animationen
const style = document.createElement('style');
style.innerHTML = `
    @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.5; transform: scale(0.98); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);
