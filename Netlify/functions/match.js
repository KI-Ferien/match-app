const ZODIACS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", 
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische" 
];

function renderCards() {
    const personCountSelect = document.getElementById('personCount');
    const container = document.getElementById('participants-grid');
    
    if (!personCountSelect || !container) return;
    
    const count = personCountSelect.value;
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'card'; 
        
        card.innerHTML = `
            <h3 style="margin:0 0 10px 0;">Reisende(r) ${i}</h3>
            <div style="text-align: left;">
                <label style="font-size: 0.8rem; font-weight: bold;">Sternzeichen:</label>
                <select class="participant-zodiac" style="width:100%; padding:8px; border-radius:8px; margin-bottom:10px; border:1px solid #ccc;">
                    ${ZODIACS.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
                <label style="font-size: 0.8rem; font-weight: bold; display: block;">Gefühltes Alter:</label>
                <input type="number" class="participant-age" value="25" min="1" max="100" style="width:100%; padding:8px; border-radius:8px; border:1px solid #ccc;">
            </div>
        `;
        container.appendChild(card);
    }
}

async function startMatching() {
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');
    
    if (!resultDiv || !btn) return;

    const participants = Array.from(document.querySelectorAll('.participant-zodiac')).map((z, i) => ({
        zodiac: z.value,
        age: document.querySelectorAll('.participant-age')[i].value
    }));

    btn.disabled = true;
    const originalText = "Ferien-Ziel finden"; 
    btn.innerHTML = "✨ Suche läuft...";
    resultDiv.innerHTML = "<p style='color: white;'>Die KI sucht nach eurem Ferien-Ziel...</p>";

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });

        if (!response.ok) throw new Error(`Server-Fehler: ${response.status}`);

        const data = await response.json();
        
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
        btn.innerHTML = "Ferien-Ziel finden";
    }
}

// Erster Aufruf direkt beim Laden der Datei
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('button');
    if (btn) btn.innerHTML = "Ferien-Ziel finden";
    renderCards();
});
