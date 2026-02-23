document.addEventListener('DOMContentLoaded', () => {
    const ring = document.getElementById('oracle-ring');
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

    // Sternzeichen im Kreis anordnen
    signs.forEach((sign, index) => {
        const ball = document.createElement('div');
        ball.className = 'zodiac-ball';
        ball.innerHTML = `<span>${sign.icon}<br><small>${sign.name}</small></span>`;
        
        // Mathematische Positionierung im Kreis
        const angle = (index / signs.length) * 2 * Math.PI;
        const radius = 42; // Prozentsatz des Containers
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        
        ball.style.left = `${x}%`;
        ball.style.top = `${y}%`;
        ball.style.transform = `translate(-50%, -50%)`;

        ball.onclick = () => {
            ball.classList.toggle('selected');
            if (ball.classList.contains('selected')) {
                selectedSigns.push(sign.name);
            } else {
                selectedSigns = selectedSigns.filter(s => s !== sign.name);
            }
        };
        ring.appendChild(ball);
    });

    // Die Funktion bleibt EXAKT wie von Dir gewünscht
    askButton.onclick = async () => {
        if (selectedSigns.length === 0) {
            status.textContent = "Bitte wähle Deine Sternzeichen!";
            return;
        }

        const payload = {
            signs: selectedSigns,
            participants: document.getElementById('participants').value,
            distance: document.getElementById('distance').value,
            vibe: "Fließende Balance",
            budget: "Goldene Mitte",
            transport: "Gefährten der Straße"
        };

        status.textContent = "Das Orakel liest in den Sternen...";
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
            status.textContent = "Verbindung zum Kosmos unterbrochen.";
            askButton.disabled = false;
        }
    };
});
