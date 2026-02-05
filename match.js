/**
 * match.js - KI-Ferien.de
 * CLEAN VERSION: Nur Logik, kein Bauen.
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', () => {
    // Nur Karten rendern, sonst NICHTS tun (kein Injecten mehr!)
    renderCards();
});

// Erzeugt die Sternzeichen-Auswahl basierend auf der Anzahl
function renderCards() {
    const countSelect = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    
    if (!container || !countSelect) return;
    
    const count = countSelect.value;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>Reisende(r) ${i}</h3>
            <label>Sternzeichen:</label>
            <select class="participant-zodiac">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label>Alter:</label>
            <input type="number" class="participant-age" value="30" min="1" max="99">
        `;
        container.appendChild(div);
    }
}

// Die eigentliche Logik beim Klick
async function startMatching() {
    const btn = document.querySelector('button');
    const resultDiv = document.getElementById('result');
    
    // Felder aus dem HTML lesen
    const emailField = document.getElementById('userEmail');
    const vibeField = document.getElementById('vibeRange');
    const hobbiesField = document.getElementById('hobbiesInput');

    // Validierung
    const email = emailField ? emailField.value : '';
    if (!email || !email.includes('@')) {
        alert("Bitte gib eine gültige Email-Adresse ein.");
        if(emailField) emailField.focus();
        return;
    }

    // Daten sammeln
    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    // UI Feedback
    btn.disabled = true;
    btn.innerHTML = "🚀 Wird gesendet...";
    resultDiv.innerHTML = "Verbindung wird aufgebaut...";
    resultDiv.style.color = "#333"; // Dunkle Schrift für Lesbarkeit

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                participants, 
                vibe: vibeField ? vibeField.value : 50, 
                hobbies: hobbiesField ? hobbiesField.value : '', 
                email 
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Fehler beim Senden");

        resultDiv.innerHTML = `
            <div style="background: #e8f5e9; color: #2e7d32; padding: 20px; border-radius: 10px; border: 1px solid #2e7d32; text-align: left;">
                <h3 style="margin-top:0;">✅ Email versendet!</h3>
                <p>Checke dein Postfach: <strong>${email}</strong></p>
                <hr style="opacity:0.2">
                <small>Vorschau: ${data.preview}</small>
            </div>`;

    } catch (e) {
        console.error(e);
        resultDiv.innerHTML = `<div style="background:#ffebee; color:#c62828; padding:15px; border-radius:10px;">Fehler: ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Neue Analyse anfordern";
    }
}

// Globale Verfügbarkeit für den HTML-Button
window.renderCards = renderCards;
window.startMatching = startMatching;
