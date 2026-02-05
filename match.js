/**
 * match.js - KI-Ferien.de
 * STABILE VERSION - EXAKT FÜR DEINE INDEX.HTML
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// 1. Initialisierung: Sorgt dafür, dass beim Start alles bereit ist
document.addEventListener('DOMContentLoaded', () => {
    console.log("System bereit.");
    renderCards(); 
});

// 2. Diese Funktion wird von deiner index.html (onchange="renderCards()") aufgerufen
function renderCards() {
    const personCountSelect = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    
    if (!personCountSelect || !container) return;
    
    const count = personCountSelect.value;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card'; // Nutzt das Design aus deiner index.html
        
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0; color: #333;">Reisende(r) ${i}</h3>
            <div style="text-align: left;">
                <label style="font-size: 0.8rem; font-weight: bold;">Sternzeichen:</label>
                <select class="participant-zodiac" style="width:100%; padding:8px; border-radius:5px; margin-bottom:10px;">
                    ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
                <label style="font-size: 0.8rem; font-weight: bold; display: block;">Alter:</label>
                <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:5px;">
            </div>
        `;
        container.appendChild(card);
    }
}

// 3. Diese Funktion wird von deinem Button (onclick="startMatching()") aufgerufen
async function startMatching() {
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');
    
    if (!resultDiv) return;

    // Daten für die KI sammeln
    const participants = [];
    const zodiacs = document.querySelectorAll('.participant-zodiac');
    const ages = document.querySelectorAll('.participant-age');

    zodiacs.forEach((z, i) => {
        participants.push({
            zodiac: z.value,
            age: ages[i].value
        });
    });

    // Button sperren, damit man nicht doppelt klickt
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "<p style='color: white;'>Die Sterne werden befragt...</p>";

    try {
        // Aufruf an deine Netlify Function
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error("Fehler bei der Verbindung zum Orakel.");

        const data = await response.json();
        
        // Ergebnis anzeigen
        resultDiv.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin-top: 20px; color: #333; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0; color: #ff6b6b;">Eure Ferien-Empfehlung</h2>
                <div style="font-size: 1.1rem; line-height: 1.6;">${data.recommendation}</div>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: #ff6b6b; background: white; padding: 15px; border-radius: 10px;">Fehler: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
