// app.js - Finale Version für KI-Ferien.de

const zodiacs = [
  { name: 'Widder', date: '21.03.-20.04.', info: 'Feuerzeichen: Braucht Aktion, Abenteuer und Unabhängigkeit in den Ferien.' }, 
  { name: 'Stier', date: '21.04.-20.05.', info: 'Erdzeichen: Genießt Luxus, gutes Essen und tiefe Entspannung in der Natur.' },
  { name: 'Zwillinge', date: '21.05.-21.06.', info: 'Luftzeichen: Sucht Abwechslung, Städtetrips und geistige Stimulation.' }, 
  { name: 'Krebs', date: '22.06.-22.07.', info: 'Wasserzeichen: Liebt Geborgenheit, oft Ferien am Wasser oder mit der Familie.' },
  { name: 'Löwe', date: '23.07.-23.08.', info: 'Feuerzeichen: Bevorzugt exklusive Ziele, Sonne und Orte mit Glamour-Faktor.' }, 
  { name: 'Jungfrau', date: '24.08.-23.09.', info: 'Erdzeichen: Schätzt gut organisierte Ferien, Kultur und Wellness.' },
  { name: 'Waage', date: '24.09.-23.10.', info: 'Luftzeichen: Sucht Harmonie, Kunst, Romantik und ästhetische Umgebungen.' }, 
  { name: 'Skorpion', date: '24.10.-22.11.', info: 'Wasserzeichen: Mag geheimnisvolle Orte, tiefgründige Erlebnisse und Rückzug.' },
  { name: 'Schütze', date: '23.11.-21.12.', info: 'Feuerzeichen: Der geborene Weltreisende. Sucht Fernweh, Kultur und Natur.' }, 
  { name: 'Steinbock', date: '22.12.-20.01.', info: 'Erdzeichen: Bevorzugt Berge, ruhige Orte und qualitativ hochwertige Ferien.' },
  { name: 'Wassermann', date: '21.01.-19.02.', info: 'Luftzeichen: Liebt das Ungewöhnliche, abseits des Massentourismus.' }, 
  { name: 'Fische', date: '20.02.-20.03.', info: 'Wasserzeichen: Braucht das Meer, spirituelle Orte und viel Zeit zum Träumen.' }
];

const vibeLabels = ['Tiefe Stille', 'Sanfte Muse', 'Fließende Balance', 'Lebendiger Puls', 'Pures Adrenalin'];
const budgetLabels = ['Bescheidener Pfad', 'Bewusste Wahl', 'Goldene Mitte', 'Edler Komfort', 'Kosmischer Luxus'];
const distanceLabels = ['Heimatliche Gefilde', 'Nachbarreiche', 'Kontinentale Weite', 'Über die Meere', 'Ans Ende der Welt'];
const transportLabels = ['Eigener Weg', 'Eiserne Pfade', 'Gefährten der Straße', 'Getragen von Wellen', 'Flug der Falken'];

function getPlaceholderText(count) {
  return count === 1 ? 'Wähle Dein Sternzeichen' : `Wähle die ${count} Sternzeichen`;
}

function updateChosenSignsDisplay() {
  const container = document.getElementById('chosen-signs');
  const activeElements = document.querySelectorAll('.zodiac-item.active');
  const count = parseInt(document.getElementById('participants').value);
  
  if (activeElements.length === 0) {
    container.innerHTML = `<span id="signsPlaceholder" class="placeholder-text">${getPlaceholderText(count)}</span>`;
    return;
  }
  
  container.innerHTML = '';
  activeElements.forEach(el => {
    const name = el.querySelector('.z-name').textContent;
    const badge = document.createElement('span');
    badge.className = 'chosen-badge';
    badge.textContent = name;
    container.appendChild(badge);
  });
}

function initZodiacs() {
  const ring = document.getElementById('zodiac-ring');
  if (!ring) return; 
  ring.innerHTML = ''; 
  
  const radius = 50; 
  zodiacs.forEach((z, index) => {
    const angle = (index / 12) * (2 * Math.PI) - (Math.PI / 2); 
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);

    const el = document.createElement('div');
    el.className = 'zodiac-item';
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    
    el.innerHTML = `
      <div class="z-name">${z.name}</div>
      <div class="z-date">${z.date}</div>
      <div class="z-tooltip"><strong>${z.name}</strong><br>${z.info}</div>
    `;
    
    el.addEventListener('click', () => {
      const isActivating = !el.classList.contains('active');
      const currentActiveCount = document.querySelectorAll('.zodiac-item.active').length;
      const maxAllowed = parseInt(document.getElementById('participants').value);
      const statusEl = document.getElementById('status');

      if (isActivating && currentActiveCount >= maxAllowed) {
        statusEl.style.color = '#ff7676';
        statusEl.textContent = maxAllowed === 1 ? 'Du kannst nur ein Zeichen wählen.' : `Du kannst maximal ${maxAllowed} Zeichen wählen.`;
        return;
      }

      el.classList.toggle('active');
      statusEl.textContent = ''; 
      updateChosenSignsDisplay();
    });

    ring.appendChild(el);
  });
}
initZodiacs();

const participants = document.getElementById('participants');
if (participants) {
  participants.addEventListener('input', () => {
    const newCount = parseInt(participants.value);
    document.getElementById('participantsVal').textContent = newCount;
    const activeElements = Array.from(document.querySelectorAll('.zodiac-item.active'));
    if (activeElements.length > newCount) {
      for (let i = newCount; i < activeElements.length; i++) {
        activeElements[i].classList.remove('active');
      }
    }
    document.getElementById('status').textContent = '';
    updateChosenSignsDisplay(); 
  });
}

document.getElementById('vibe')?.addEventListener('input', (e) => {
  document.getElementById('vibeVal').textContent = vibeLabels[e.target.value - 1];
});
document.getElementById('budget')?.addEventListener('input', (e) => {
  document.getElementById('budgetVal').textContent = budgetLabels[e.target.value - 1];
});
document.getElementById('distance')?.addEventListener('input', (e) => {
  document.getElementById('distanceVal').textContent = distanceLabels[e.target.value - 1];
});
document.getElementById('transport')?.addEventListener('input', (e) => {
  document.getElementById('transportVal').textContent = transportLabels[e.target.value - 1];
});

function createStars() {
  const bg = document.getElementById('space-background');
  if (!bg) return;
  const numStars = 200;
  const colors = ['#ffffff', '#ffe9c4', '#d4af37', '#a3c2ff', '#e0c8ff'];
  
  for(let i=0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    const radius = Math.random() * 60 + 10;
    const angle = Math.random() * 360;
    const durTwinkle = Math.random() * 4 + 2;
    const durOrbit = Math.random() * 120 + 60;
    const color = colors[Math.floor(Math.random() * colors.length)];

    star.style.width = `${size}px`; star.style.height = `${size}px`;
    star.style.backgroundColor = color; star.style.boxShadow = `0 0 ${Math.random() * 8 + 2}px ${color}`;
    star.style.left = `calc(50% + ${Math.cos(angle) * radius}vmin)`;
    star.style.top = `calc(50% + ${Math.sin(angle) * radius}vmin)`;
    star.style.setProperty('--radius', `${radius}vmin`);
    star.style.animationDuration = `${durTwinkle}s, ${durOrbit}s`;
    bg.appendChild(star);
  }
}
createStars();

function createSnakingThreads() {
  const svg = document.getElementById('magic-threads');
  if (!svg) return;
  
  let paths = '';
  const numThreads = 35; 
  const colors = ['#d4af37', '#8E6CF6', '#a3c2ff', '#ff7a59', '#4a235a'];

  for(let i=0; i < numThreads; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const strokeW = Math.random() * 0.4 + 0.1; 
    const duration = 80 + Math.random() * 100; 
    const delay = -(Math.random() * 100);
    
    const isHorizontal = Math.random() > 0.5;
    let d = '';
    
    if (isHorizontal) {
      const startY = Math.random() * 100;
      const endY = Math.random() * 100;
      d = `M -10 ${startY} C 30 ${Math.random()*120 - 10}, 70 ${Math.random()*120 - 10}, 110 ${endY}`;
    } else {
      const startX = Math.random() * 100;
      const endX = Math.random() * 100;
      d = `M ${startX} -10 C ${Math.random()*120 - 10} 30, ${Math.random()*120 - 10} 70, ${endX} 110`;
    }

    paths += `<path class="snaking-thread" d="${d}" 
      stroke="${color}" stroke-width="${strokeW}" 
      stroke-dasharray="200" stroke-dashoffset="200"
      style="animation-duration: ${duration}s; animation-delay: ${delay}s;" />`;
  }
  
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.innerHTML = paths;
}
createSnakingThreads();

// DIE ENTSCHEIDENDE FUNKTION MIT KORREKTEM PFAD
async function callMatch(payload){
  const status = document.getElementById('status');
  status.style.color = 'var(--delphi-gold)';
  status.textContent = 'Die Sterne weisen den Weg...';
  
  try {
    // Geänderter Pfad für Netlify Functions
    const res = await fetch('/.netlify/functions/match', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Server-Fehler Details:", errorText);
        throw new Error(`Server antwortet mit Status ${res.status}`);
    }

    return await res.json();
  } catch (err){
    console.error("Kommunikationsfehler mit dem Orakel:", err);
    throw err;
  } finally {
    status.textContent = '';
  }
}

const askBtn = document.getElementById('askOrakel');
if (askBtn) {
  askBtn.addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    const activeSigns = [];
    document.querySelectorAll('.zodiac-item.active').forEach(i => { 
      activeSigns.push(i.querySelector('.z-name').textContent); 
    });

    const requiredParticipants = Number(participants.value);

    if (activeSigns.length !== requiredParticipants) {
      statusEl.style.color = '#ff7676';
      statusEl.textContent = `Die Sterne fordern exakt ${requiredParticipants} gewählte Zeichen.`;
      askBtn.style.transform = 'translateX(-5px)';
      setTimeout(() => askBtn.style.transform = 'translateX(5px)', 100);
      setTimeout(() => askBtn.style.transform = 'scale(1)', 200);
      return; 
    }

    const payload = {
      signs: activeSigns,
      participants: requiredParticipants,
      vibe: document.getElementById('vibeVal').textContent,
      budget: document.getElementById('budgetVal').textContent,
      distance: document.getElementById('distanceVal').textContent,
      transport: document.getElementById('transportVal').textContent
    };

    try {
      const result = await callMatch(payload);
      sessionStorage.setItem('orakelResult', JSON.stringify({payload, result}));
      window.location.href = 'reise.html';
    } catch(e) {
      statusEl.style.color = '#ff7676';
      statusEl.textContent = 'Kosmische Störung. Bitte erneut versuchen.';
    }
  });
}
