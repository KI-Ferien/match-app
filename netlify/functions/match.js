const zodiacs = ["Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau", "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische"];

function renderCards() {
    const count = document.getElementById('personCount').value;
    const grid = document.getElementById('participants-grid');
    grid.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        grid.innerHTML += `
            <div class="card">
                <h3>Teilnehmer ${i}</h3>
                <select class="zodiac">
                    ${zodiacs.map(z => `<option value="${z}">${z}</option>`).join('')}
                </select>
                <input type="number" class="age" placeholder="Gefühltes Alter" min="1" max="100" value="25">
            </div>
        `;
    }
}

async function startMatching() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "KI analysiert eure Sternzeichen...";

    const zodiacsSelected = document.querySelectorAll('.zodiac');
    const agesSelected = document.querySelectorAll('.age');
    
    const participants = [];
    zodiacsSelected.forEach((z, i) => {
        participants.push({ zodiac: z.value, age: agesSelected[i].value });
    });

    try {
        const response = await fetch('/api/gruppen-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants })
        });
        const data = await response.json();
        resultDiv.innerHTML = `Das ideale Ziel für euch: <br><span style="color:#ff6b6b; font-size: 1.5em;">${data.recommendation}</span>`;
    } catch (error) {
        resultDiv.innerHTML = "Fehler beim Matching. Prüfe die Konsole!";
    }
}

// Initialer Aufruf
renderCards();
