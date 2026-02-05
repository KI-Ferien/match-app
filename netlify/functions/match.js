/**
 * match.js - KI-Ferien.de
 * Version: 2.0 (Post-TOML-Fix)
 * Fokus: Maximale Fehlertoleranz und Feedback
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Sicherstellen, dass das Skript erst läuft, wenn das HTML bereit ist
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Kosmische Analyse: Skript geladen.");
    
    const personCountSelect = document.getElementById('personCount');
    const matchButton = document.getElementById('matchButton');
    const grid = document.getElementById('participants-grid');

    // 1. Initialer Aufbau der Karten
    if (personCountSelect && grid) {
        renderParticipantCards(personCountSelect.value);
        personCountSelect.addEventListener('change', (e) => renderParticipantCards(e.target.value));
        console.log("✅ Teilnehmer-Karten bereit.");
    } else {
        console.warn("⚠️ HTML-Elemente für Karten fehlen. Prüfe IDs 'personCount' und 'participants-grid'.");
    }

    // 2. Button-Event verknüpfen
    if (matchButton) {
        matchButton.addEventListener('click', startCosmicAnalysis);
        console.log("✅ Analyse-Button verknüpft.");
    } else {
        console.error("❌ Button mit ID 'matchButton' fehlt im HTML!");
    }
});

/**
 * Erzeugt die Eingabe-Karten dynamisch
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
            <select class="participant-zodiac" style="width:100%; padding:10px; margin:5px 0 15px 0; border-radius:8px; border:none;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label style="font-size: 0.8rem; opacity: 0.8;">Gefühltes Alter</label>
            <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:10px; border-radius:8px; border:none;">
        `;
        container.appendChild(card);
    }
}

/**
 * Kernfunktion: Kommunikation mit der Netlify Function
 */
async function startCosmicAnalysis() {
    const btn = document.getElementById('matchButton');
    const resultDiv = document.getElementById('result');
    if (!btn || !resultDiv) return;

    // Daten aus UI sammeln
    const participants = [];
    const zodiacs = document.querySelectorAll('.participant-zodiac');
    const ages = document.querySelectorAll('.participant-age');

    zodiacs.forEach((z, i) => {
        participants.push({
            zodiac: z.value,
            age: ages[i].value
        });
    });

    // UI-Zustand: Laden
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Analyse wird erstellt...";
    resultDiv.innerHTML = "<p style='color: #ffd700; font-style: italic;'>Verbinde mit dem KI-Orakel...</p>";

    try {
        console.log("📡 Sende Daten an /api/gruppen-match...");
        
        // Nutzt den Pfad, der durch netlify.toml /api/* definiert wurde
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) {
            const errorInfo = await response.text();
            throw new Error(`Status ${response.status}: ${errorInfo}`);
        }

        const data = await response.json();
        console.log("✅ Antwort empfangen.");

        // Ergebnis präsentieren
        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.15); padding:25px; border-radius:20px; color:white; margin-top:30px; border:1px solid #ffd700; animation: fadeIn 0.5s ease-in;">
                <h2 style="color:#ffd700; margin-top:0;">Eure Kosmische Analyse</h2>
                <div style="font-size:1.1rem; line-height:1.6; white-space: pre-wrap;">${data.recommendation}</div>
            </div>
        `;

    } catch (error) {
        console.error("❌ Analyse-Fehler:", error);
        resultDiv.innerHTML = `
            <div style="color:#ff6b6b; padding:20px; border: 1px solid #ff6b6b; border-radius:10px; background:rgba(255,0,0,0.1);">
                <strong>Analyse unterbrochen.</strong><br>
                Grund: ${error.message}<br><br>
                <em>Tipp: Prüfe, ob die Netlify Function im Ordner 'netlify/functions/' liegt.</em>
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Kleine Animation für das Ergebnis
const style = document.createElement('style');
style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);
