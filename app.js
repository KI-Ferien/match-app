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

    signs.forEach(sign => {
        const ball = document.createElement('div');
        ball.className = 'zodiac-ball';
        ball.innerHTML = `<div>${sign.icon}<br><small>${sign.name}</small></div>`;
        ball.onclick = () => {
            ball.classList.toggle('selected');
            const name = sign.name;
            if (ball.classList.contains('selected')) selectedSigns.push(name);
            else selectedSigns = selectedSigns.filter(s => s !== name);
        };
        zodiacContainer.appendChild(ball);
    });

    askButton.onclick = async () => {
        if (selectedSigns.length === 0) return;

        const payload = {
            signs: selectedSigns,
            participants: document.getElementById('participants').value,
            vibe: document.getElementById('vibe').value,
            distance: document.getElementById('distance').value,
            budget: "Goldene Mitte",
            transport: "Gefährten der Straße"
        };

        status.textContent = "Die Sterne ordnen sich...";
        askButton.disabled = true;

        try {
            const response = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            sessionStorage.setItem('orakelResult', JSON.stringify({ result }));
            window.location.href = 'reise.html';
        } catch (e) {
            status.textContent = "Fehler. Bitte erneut versuchen.";
            askButton.disabled = false;
        }
    };
});
