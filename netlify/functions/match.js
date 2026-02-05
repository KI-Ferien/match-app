/**
 * match.js - KI-Ferien.de
 * VERSION: 11.0 - DER LETZTE VERSUCH
 */

// 1. ABSOLUTE PRIORITÄT: Titel ändern
document.title = "!!! V11 AKTIV !!!";

console.log("%c 🚀 KI-FERIEN VERSION 11 GELADEN", "color: yellow; background: black; font-size: 20px;");

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

function init() {
    // Titel erneut setzen
    document.title = "V11: Kosmische Ferien-Analyse";
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    if (!personCountSelect || !matchButton || !grid) {
        console.error("❌ KRITISCHER FEHLER: HTML-Elemente nicht gefunden!");
        console.log("Gefundene IDs:", { personCountSelect, matchButton, grid });
        return;
    }

    renderParticipantCards(personCountSelect.value);
    personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
    matchButton.addEventListener('click', startCosmicAnalysis);
    console.log("✅ V11: Alles bereit.");
}

function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.style.cssText = "background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); border:1px solid white; padding:20px; border-radius:15px; margin:10px; color:white;";
        
        card.innerHTML = `
            <h3>Reisende(r) ${i}</h3>
            <select class="participant-zodiac" style="width:100%; padding:10px; margin:10px 0; color:black;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <input type="number" class="participant-age" value="25" style="width:100%; padding:10px; color:black;">
        `;
        container.appendChild(card);
    }
}

async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    
    btn.disabled = true;
    btn.innerHTML = "✨ KI arbeitet...";
    resultDiv.innerHTML = "Verbinde mit /api/match...";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                participants: Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
                    zodiac: z.value,
                    age: document.querySelectorAll('.participant-age')[i].value
                }))
            })
        });

        const data = await response.json();
        resultDiv.innerHTML = `<div style="padding:20px; border:2px solid #ffd700; margin-top:20px;">${data.recommendation || "Fehler in der Antwort"}</div>`;
    } catch (error) {
        resultDiv.innerHTML = "Fehler: " + error.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Kosmische Ferien-Analyse starten";
    }
}

// Startet die App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
