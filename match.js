/**
 * match.js - Frontend Logic
 * Supports: Budget, Singular/Plural, Gefühltes Alter
 */

const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"
];

document.addEventListener('DOMContentLoaded', () => {
    renderCards();
});

function renderCards() {
    const countSelect = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    const subtitle = document.querySelector('.subtitle');
    
    if (!container || !countSelect) return;
    
    const count = parseInt(countSelect.value);
    
    // UI Text Anpassung: Singular vs Plural
    if (subtitle) {
        subtitle.textContent = count === 1 
            ? "Finde das perfekte Ziel für dich." 
            : "Finde das perfekte Ziel für euch.";
    }

    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${count === 1 ? 'Reisende(r)' : `Reisende(r) ${i}`}</h3>
            <label>Sternzeichen:</label>
            <select class="participant-zodiac">
                ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
            </select>
            <label>Gefühltes Alter:</label>
            <input type="number" class="participant-age" value="25" min="1" max="99">
        `;
        container.appendChild(div);
    }
}

async function startMatching() {
    const btn = document.querySelector('button');
    const resultDiv = document.getElementById('result');
    const emailField = document.getElementById('userEmail');
    const vibeField = document.getElementById('vibeRange');
    const budgetField = document.getElementById('budgetRange');
    const hobbiesField = document.getElementById('hobbiesInput');

    const email = emailField ? emailField.value : '';
    if (!email || !email.includes('@')) {
        alert("Bitte gib eine gültige Email-Adresse ein.");
        if(emailField) emailField.focus();
        return;
    }

    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    btn.disabled = true;
    btn.innerHTML = "🚀 Wird gesendet...";
    resultDiv.style.color = "#333"; 
    resultDiv.innerHTML = "Verbindung wird aufgebaut...";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                participants, 
                vibe: vibeField ? vibeField.value : 50, 
                budget: budgetField ? budgetField.value : 50,
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

window.renderCards = renderCards;
window.startMatching = startMatching;
