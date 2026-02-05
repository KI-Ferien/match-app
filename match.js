/**
 * match.js - KI-Ferien.de
 * ABSOLUT STABILE VERSION
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Diese Funktion wird von deinem HTML 'onchange="renderCards()"' aufgerufen
function renderCards() {
    const count = document.getElementById('personCount').value;
    const container = document.getElementById('participants-grid');
    if (!container) return;
    
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0;">Teilnehmer ${i}</h3>
            <select class="participant-zodiac" style="width:100%; padding:8px; border-radius:5px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:5px; margin-top:10px;">
        `;
        container.appendChild(card);
    }
}

// Diese Funktion wird von deinem HTML 'onclick="startMatching()"' aufgerufen
async function startMatching() {
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');
    
    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    btn.disabled = true;
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "Die KI befragt die Sterne...";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        const data = await response.json();
        resultDiv.innerHTML = `<div style="background:rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin-top:20px;">
            <h2 style="margin-top:0;">Euer Ferien-Ziel</h2>
            <p style="font-weight:normal;">${data.recommendation || "Fehler in der Antwort"}</p>
        </div>`;
    } catch (e) {
        resultDiv.innerHTML = "Fehler: " + e.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Ferien-Ziel finden";
    }
}

// Initialisierung beim ersten Laden
document.addEventListener('DOMContentLoaded', renderCards);
