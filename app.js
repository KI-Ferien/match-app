document.addEventListener('DOMContentLoaded', () => {
    const zodiacContainer = document.getElementById('zodiac-container');
    const status = document.getElementById('status');
    const askButton = document.getElementById('ask-oracle');

    const signs = [
        { name: 'Widder', icon: '♈' }, { name: 'Stier', icon: '♉' },
        { name: 'Zwillinge', icon: '♊' }, { name: 'Krebs', icon: '♋' },
        { name: 'Löwe', icon: '♌' }, { name: 'Jungfrau', icon: '♍' },
        { name: 'Waage', icon: '♎' }, { name: 'Skorpion', icon: '♏' },
        { name: 'Schütze', icon: '♐' }, { name: 'Steinbock', icon: '♑' },
        { name: 'Wassermann', icon: '♒' }, { name: 'Fische', icon: '♓' }
    ];

    let selectedSigns = [];

    // Erstelle die Kugeln
    signs.forEach(sign => {
        const ball = document.createElement('div');
        ball.className = 'zodiac-ball';
        ball.innerHTML = `<div><span style="font-size: 1.5rem;">${sign.icon}</span><br><small>${sign.name}</small></div>`;
        
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

    askButton.addEventListener('click', async () => {
        if (selectedSigns.length === 0) {
            status.textContent = "Wähle Deine Zeichen, bevor Du das Orakel weckst.";
            return;
        }

        const payload = {
            signs: selectedSigns,
            participants: document.getElementById('participants').value,
            vibe: document.getElementById('vibe').value,
            budget: "Goldene Mitte", // Standardwert
            distance: document.getElementById('distance').value,
            transport: "Gefährten der Straße" 
        };

        status.textContent = "Das Orakel befragt die Gezeiten...";
        askButton.disabled = true;

        try {
            const response = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Kommunikationsfehler');

            const result = await response.json();
            sessionStorage.setItem('orakelResult', JSON.stringify({ result }));
            window.location.href = 'reise.html';

        } catch (error) {
            status.textContent = "Eine dunkle Wolke zieht auf. Versuche es erneut.";
            console.error(error);
            askButton.disabled = false;
        }
    });
});
