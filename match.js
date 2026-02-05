/**
 * match.js - KI-Ferien.de
 * Version: 4.0 - "Finden" statt "Berechnen" & Klick-Garantie
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    // Sofort-Check: Ändert die Button-Farbe ganz leicht, damit du weißt: JS läuft!
    const matchButton = document.getElementById('matchButton');
    if (matchButton) {
        matchButton.style.border = "2px solid #ffd700";
        matchButton.innerHTML = "Ferien-Ziel finden"; // Text-Anpassung
        matchButton.addEventListener('click', startCosmicAnalysis);
        console.log("✅ Skript aktiv: Button 'Ferien-Ziel finden' ist bereit.");
    } else {
        console.error("❌ Fehler: Button mit ID 'matchButton' nicht im HTML gefunden!");
    }

    const personCountSelect = document.getElementById('personCount');
    const grid = document.getElementById('participants-grid');

    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
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
    
    if (!resultDiv) {
        alert("Fehler: Das Feld für das Ergebnis (ID: result) fehlt im HTML!");
        return;
    }

    // Daten sammeln
    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    // Visuelles Feedback beim Klick
    btn.disabled = true;
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "<div style='text-align:center; padding:20px; color:#ffd700;'>Die KI befragt die Sterne für eure Ferien...</div>";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) {
            throw new Error(`Server meldet Fehler ${response.status}. Prüfe die Netlify Functions.`);
        }

        const data = await response.json();
        
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:25px; border-radius:20px; color:white; border:1px solid #ffd700; margin-top:20px; animation: fadeIn 0.5s;">
                <h2 style="color:#ffd700; margin-top:0;">Euer Ferien-Ziel</h2>
                <p style="line-height:1.6; font-size:1.1rem;">${data.recommendation}</p>
            </div>
        `;

    } catch (error) {
        console.error("Analyse-Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff6b6b; padding:20px; border:1px solid #ff6b6b; border-radius:15px; background:rgba(255,0,0,0.1);">
                <strong>Hoppla!</strong><br>${error.message}
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Ferien-Ziel finden";
    }
}
