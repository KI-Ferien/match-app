/**
 * match.js - KI-Ferien.de
 * Abgestimmt auf die bereitgestellte index.html
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// 1. Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 match.js geladen und bereit.");
    renderCards(); // Erzeugt die erste Karte sofort
});

// 2. Erzeugt die Teilnehmer-Karten (wird von onchange="renderCards()" im HTML aufgerufen)
function renderCards() {
    const personCountSelect = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    
    if (!personCountSelect || !container) return;
    
    const count = personCountSelect.value;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card'; // Nutzt dein CSS aus der index.html
        
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0; color: #333;">Teilnehmer ${i}</h3>
            <div style="text-align: left;">
                <label style="font-size: 0.8rem; font-weight: bold;">Sternzeichen:</label>
                <select class="participant-zodiac">
                    ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
                <label style="font-size: 0.8rem; font-weight: bold; display: block; margin-top: 10px;">Gefühltes Alter:</label>
                <input type="number" class="participant-age" value="25" min="1" max="100">
            </div>
        `;
        container.appendChild(card);
    }
}

// 3. Die Logik für den Button (wird von onclick="startMatching()" im HTML aufgerufen)
async function startMatching() {
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');
    
    if (!resultDiv) return;

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

    // UI-Zustand ändern
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "<p style='color: #fff;'>Die KI befragt die Sterne für eure Ferien...</p>";

    try {
        // Aufruf der Netlify Function über den virtuellen API-Pfad
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) {
            throw new Error(`Server-Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Ergebnis im dafür vorgesehenen Feld anzeigen
        resultDiv.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin-top: 20px; color: #333; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <h2 style="margin-top: 0; color: #ff6b6b;">Eure Ferien-Empfehlung</h2>
                <p style="font-size: 1.1rem; line-height: 1.6;">${data.recommendation}</p>
            </div>
        `;
    } catch (error) {
        console.error("Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color: #ff6b6b; background: rgba(255,255,255,0.8); padding: 15px; border-radius: 10px;">
                <strong>Oje!</strong> Da gab es eine Störung im Äther: ${error.message}
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
