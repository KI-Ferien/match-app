document.addEventListener('DOMContentLoaded', () => {
    const zodiacContainer = document.getElementById('zodiac-container');
    const status = document.getElementById('status');
    const askButton = document.getElementById('ask-oracle');

    // Die 12 Gefährten des Tierkreises
    const signs = [
        { name: 'Widder', icon: '♈' }, { name: 'Stier', icon: '♉' },
        { name: 'Zwillinge', icon: '♊' }, { name: 'Krebs', icon: '♋' },
        { name: 'Löwe', icon: '♌' }, { name: 'Jungfrau', icon: '♍' },
        { name: 'Waage', icon: '♎' }, { name: 'Skorpion', icon: '♏' },
        { name: 'Schütze', icon: '♐' }, { name: 'Steinbock', icon: '♑' },
        { name: 'Wassermann', icon: '♒' }, { name: 'Fische', icon: '♓' }
    ];

    let selectedSigns = [];

    // Kugeln dynamisch erstellen
    signs.forEach(sign => {
        const ball = document.createElement('div');
        ball.className = 'zodiac-ball';
        ball.innerHTML = `<div>${sign.icon}<br><small>${sign.name}</small></div>`;
        
        ball.addEventListener('click', () => {
            if (ball.classList.contains('selected')) {
                ball.classList.remove('selected');
                selectedSigns = selectedSigns.filter(s => s !== sign.name);
            } else {
                ball.classList.add('selected');
                selectedSigns.push(sign.name);
            }
        });
        zodiacContainer.appendChild(ball);
    });

    // Das Orakel befragen
    askButton.addEventListener('click', async () => {
        if (selectedSigns.length === 0) {
            status.textContent = "Bitte wähle mindestens ein Sternzeichen!";
            return;
        }

        const payload = {
            signs: selectedSigns,
            vibe: document.getElementById('vibe').value,
            budget: document.getElementById('budget').value,
            distance: document.getElementById('distance').value,
            participants: 2, // Standardwert
            transport: "Gefährten der Straße" // Standardwert
        };

        status.textContent = "Die Sterne ordnen sich... einen Augenblick.";
        askButton.disabled = true;

        try {
            const response = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Kosmische Unterbrechung');

            const result = await response.json();
            
            // Ergebnis für die reise.html speichern
            sessionStorage.setItem('orakelResult', JSON.stringify({ result }));
            window.location.href = 'reise.html';

        } catch (error) {
            status.textContent = "Eine dunkle Wolke verdeckt die Sicht. Versuche es gleich noch einmal.";
            console.error(error);
        } finally {
            askButton.disabled = false;
        }
    });
});
