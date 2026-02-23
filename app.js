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

    // Sternzeichen-Kugeln erstellen
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

    // Orakel-Anfrage
    askButton.addEventListener('click', async () => {
        if (selectedSigns.length === 0) {
            status.textContent = "Wähle Deine Sternzeichen, um das Schicksal zu rufen.";
            return;
        }

        const payload = {
            signs: selectedSigns,
            participants: document.getElementById('participants').value,
            vibe: document.getElementById('vibe').value,
            budget: document.getElementById('budget').value,
            distance: document.getElementById('distance').value,
            transport: "Gefährten der Straße" // Kann bei Bedarf auch als Select ergänzt werden
        };

        status.textContent = "Das Orakel liest in den Linien der Zeit...";
        askButton.disabled = true;

        try {
            const response = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Kosmische Störung im Backend');

            const result = await response.json();
            
            // Speichern und Weiterleiten
            sessionStorage.setItem('orakelResult', JSON.stringify({ result }));
            window.location.href = 'reise.html';

        } catch (error) {
            status.textContent = "Die Sterne sind getrübt. Versuche es erneut.";
            console.error(error);
        } finally {
            askButton.disabled = false;
        }
    });
});
