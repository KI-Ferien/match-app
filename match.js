/**
 * match.js - KI-Ferien.de
 * Version: Full-Service (Inputs + Email)
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    injectExtraFields(); // Baut Slider & Email-Feld ein
    renderCards();       // Baut die Teilnehmer-Karten
    
    // Button Text anpassen
    const btn = document.querySelector('button');
    if (btn) btn.innerHTML = "Kosmische Ferien-Analyse per Email";
});

// Fügt die fehlenden Eingabefelder (Slider, Email, Hobbies) dynamisch hinzu
function injectExtraFields() {
    const grid = document.getElementById('participants-grid');
    if (!grid || document.getElementById('extra-options')) return;

    const extras = document.createElement('div');
    extras.id = 'extra-options';
    extras.style.cssText = "grid-column: 1 / -1; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin-top: 20px; text-align: left; color: white;";
    
    extras.innerHTML = `
        <h3 style="margin-top:0; color:#ffd700;">Reise-Details</h3>
        
        <label style="display:block; margin-bottom:5px;">Vibe: Entspannt ⟷ Action</label>
        <input type="range" id="vibeRange" min="0" max="100" value="50" style="width:100%; margin-bottom:15px;">
        
        <label style="display:block; margin-bottom:5px;">Hobbies & Wünsche:</label>
        <textarea id="hobbiesInput" rows="3" placeholder="z.B. Wandern, Veganes Essen, bloß keine Hitze..." style="width:100%; padding:10px; border-radius:8px; border:none; margin-bottom:15px; font-family:sans-serif;"></textarea>
        
        <label style="display:block; margin-bottom:5px;">Deine Email für das Ergebnis:</label>
        <input type="email" id="userEmail" placeholder="name@beispiel.de" style="width:100%; padding:10px; border-radius:8px; border:none;">
    `;
    
    // Fügt es nach dem Grid ein
    grid.parentNode.insertBefore(extras, grid.nextSibling);
}

function renderCards() {
    const count = document.getElementById('personCount').value;
    const container = document.getElementById('participants-grid');
    if (!container) return;
    
    container.innerHTML = ''; 
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3 style="margin-top:0;">Teilnehmer ${i}</h3>
            <select class="participant-zodiac" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <input type="number" class="participant-age" value="30" style="width:100%; padding:8px; border-radius:5px;">
        `;
        container.appendChild(div);
    }
}

async function startMatching() {
    const btn = document.querySelector('button');
    const resultDiv = document.getElementById('result');
    const email = document.getElementById('userEmail').value;

    if (!email || !email.includes('@')) {
        alert("Bitte gib eine gültige Email-Adresse an, damit wir dir das Ziel senden können!");
        return;
    }

    // Daten sammeln
    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    const vibe = document.getElementById('vibeRange').value;
    const hobbies = document.getElementById('hobbiesInput').value;

    btn.disabled = true;
    btn.innerHTML = "✨ Analyse & Versand läuft...";
    resultDiv.innerHTML = "<p style='color:white;'>Verbindung zum Kosmos (und Mailserver)...</p>";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants, vibe, hobbies, email })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Fehler beim Versand");

        resultDiv.innerHTML = `
            <div style="background:rgba(255,255,255,0.95); padding:25px; border-radius:15px; margin-top:20px; color:#333; border-left: 5px solid #2ecc71;">
                <h2 style="color:#2ecc71; margin-top:0;">Erfolg! 📬</h2>
                <p>Deine kosmische Ferien-Analyse wurde an <strong>${email}</strong> gesendet.</p>
                <div style="background:#f0f0f0; padding:15px; border-radius:10px; margin-top:10px; font-style:italic; color:#555;">
                    "${data.preview.substring(0, 100)}..."
                </div>
            </div>`;

    } catch (e) {
        resultDiv.innerHTML = `<div style="background:white; color:red; padding:15px; border-radius:10px;">Fehler: ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Neue Analyse starten";
    }
}
