/**
 * match.js - KI-Ferien.de
 * Version: 2.1 (Titel-Fix & Kosmische Analyse)
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    // FIX: Korrigiert den fehlerhaften Tab-Titel "Puppen-Matching"
    document.title = "KI-Ferien.de | Kosmische Ferien-Analyse";
    
    console.log("🚀 Kosmische Analyse gestartet. Tab-Titel korrigiert.");
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    // Teilnehmer-Karten initial aufbauen
    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
    }

    // Analyse-Button verknüpfen
    if (matchButton) {
        matchButton.addEventListener('click', startCosmicAnalysis);
    }
});

/**
 * Erzeugt die Eingabe-Karten für das Gruppen-Matching
 */
function renderParticipantCards(count) {
    const container = document.getElementById('participants-grid');
    if (!container) return;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.style.cssText = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:20px; border-radius:15px; margin:10px; color:white; flex: 1 1 200px;";
        
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0;">Reisende(r) ${i}</h3>
            <label style="font-size: 0.8rem; opacity: 0.8;">Sternzeichen</label>
            <select class="participant-zodiac" style="width:100%; padding:10px; margin:5px 0 15px 0; border-radius:8px; border:none; background: white;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="font-size: 0.8rem; opacity: 0.8;">Gefühltes Alter</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:10px; border-radius:8px; border:none; background: white;">
        `;
        container.appendChild(card);
    }
}

/**
 * Kommunikation mit der Netlify Function (Mistral KI)
 */
async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    if (!btn || !resultDiv) return;

    const participants = [];
    const zodiacs = document.querySelectorAll('.participant-zodiac');
    const ages = document.querySelectorAll('.participant-age');

    zodiacs.forEach((z, i) => {
        participants.push({
            zodiac: z.value,
            age: ages[i].value
        });
    });

    // Button-Feedback
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "✨ Analyse läuft...";
    resultDiv.innerHTML = "<p style='color: #ffd700; font-style: italic;'>Verbinde mit dem KI-Orakel für eure Ferien...</p>";

    try {
        // Nutzt den Pfad aus der netlify.toml
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:25px; border-radius:20px; color:white; margin-top:30px; border:1px solid #ffd700;">
                <h2 style="color:#ffd700; margin-top:0;">Eure Kosmische Analyse</h2>
                <div style="font-size:1.1rem; line-height:1.6;">${data.recommendation}</div>
            </div>
        `;

    } catch (error) {
        console.error("Fehler:", error);
        resultDiv.innerHTML = `<p style="color:#ff6b6b;">Die Sterne sind getrübt. Fehler: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
