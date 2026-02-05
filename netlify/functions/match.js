/**
 * match.js - KI-Ferien.de
 * Frontend-Logik im Root
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Wird von onchange="renderCards()" im HTML gerufen
function renderCards() {
    const select = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    if (!select || !container) return;
    
    const count = select.value;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0;">Reisende(r) ${i}</h3>
            <label style="font-size:0.8rem;">Sternzeichen:</label>
            <select class="participant-zodiac" style="width:100%; padding:8px; border-radius:5px; margin-bottom:10px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="font-size:0.8rem; display:block;">Gefühltes Alter:</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:5px;">
        `;
        container.appendChild(card);
    }
}

// Wird von onclick="startMatching()" im HTML gerufen
async function startMatching() {
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');
    if (!resultDiv || !btn) return;

    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    btn.disabled = true;
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "Die Sterne werden befragt...";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);

        const data = await response.json();
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.25); padding:25px; border-radius:15px; margin-top:20px; color:white; text-align:left;">
                <h2 style="margin-top:0; color:#ffd700;">Eure Ferien-Empfehlung</h2>
                <p style="line-height:1.6;">${data.recommendation}</p>
            </div>`;
    } catch (e) {
        resultDiv.innerHTML = `<div style="color:#ff6b6b; padding:15px; background:white; border-radius:10px;">Fehler: ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Ferien-Ziel finden";
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', renderCards);
