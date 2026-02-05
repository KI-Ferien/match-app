/**
 * match.js - Frontend (Root)
 * Baut Email & Slider automatisch ein
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    console.log("Start: Baue Seite auf...");
    
    // 1. Bau das Email-Feld und die Slider ein
    injectExtraFields();
    
    // 2. Erstelle die Teilnehmer-Karten
    renderCards();
    
    // 3. Passe den Button-Text an
    const btn = document.querySelector('button');
    if (btn) btn.innerHTML = "Kosmische Analyse per Email anfordern";
});

// --- DIESE FUNKTION ERZEUGT DAS EMAIL FELD ---
function injectExtraFields() {
    // Prüfen, ob wir das Feld schon haben, damit es nicht doppelt kommt
    if (document.getElementById('extra-options')) return;

    const grid = document.getElementById('participants-grid');
    if (!grid) return;

    // Container für die neuen Felder erstellen
    const extras = document.createElement('div');
    extras.id = 'extra-options';
    // Styling damit es auffällt (Weißer Kasten mit Schatten)
    extras.style.cssText = `
        background: rgba(255, 255, 255, 0.9); 
        padding: 25px; 
        border-radius: 15px; 
        margin: 20px auto; 
        max-width: 600px;
        text-align: left; 
        color: #333;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    extras.innerHTML = `
        <h3 style="margin-top:0; color:#ff6b6b; border-bottom:1px solid #ddd; padding-bottom:10px;">Reise-Details</h3>
        
        <label style="display:block; font-weight:bold; margin-top:15px;">Ferien-Vibe:</label>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
            <span>Entspannt 🏖️</span>
            <span>Abenteuer 🧗</span>
        </div>
        <input type="range" id="vibeRange" min="0" max="100" value="50" style="width:100%;">
        
        <label style="display:block; font-weight:bold; margin-top:15px;">Hobbies & Wünsche:</label>
        <textarea id="hobbiesInput" rows="2" placeholder="z.B. Wandern, gutes Essen, nicht zu heiß..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:5px;"></textarea>
        
        <label style="display:block; font-weight:bold; margin-top:15px; color:#2c3e50;">Deine Email-Adresse (Pflicht):</label>
        <input type="email" id="userEmail" placeholder="name@beispiel.de" style="width:100%; padding:12px; border:2px solid #ff6b6b; border-radius:8px; font-size:1rem;">
    `;
    
    // Das Ganze NACH dem Grid einfügen
    grid.parentNode.insertBefore(extras, grid.nextSibling);
}

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
            <select class="participant-zodiac" style="width:100%; padding:8px; margin-bottom:10px;">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <input type="number" class="participant-age" value="30" style="width:100%; padding:8px;">
        `;
        container.appendChild(div);
    }
}

async function startMatching() {
    const btn = document.querySelector('button');
    const resultDiv = document.getElementById('result');
    
    // Hier lesen wir das Email-Feld aus
    const emailField = document.getElementById('userEmail');
    const email = emailField ? emailField.value : '';

    if (!email || !email.includes('@')) {
        alert("Bitte gib eine gültige Email-Adresse ein!");
        if(emailField) emailField.focus();
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
    btn.innerHTML = "🚀 Email wird gesendet...";
    resultDiv.innerHTML = "Verbindung wird aufgebaut...";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants, vibe, hobbies, email })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Fehler beim Senden");

        resultDiv.innerHTML = `
            <div style="background: white; color: #27ae60; padding: 20px; border-radius: 10px; margin-top: 20px; border: 2px solid #27ae60;">
                <h2>Email versendet! ✅</h2>
                <p>Checke jetzt dein Postfach (${email}).</p>
                <small>Vorschau: ${data.preview.substring(0, 50)}...</small>
            </div>`;

    } catch (e) {
        resultDiv.innerHTML = `<div style="background:white; color:red; padding:15px;">Fehler: ${e.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Neue Analyse starten";
    }
}
