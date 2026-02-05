/**
 * KI-FERIEN Premium Gruppen-Matching
 * Mit elegantem Sternzeichen-Picker und Element-Visualisierung
 */

const CONFIG = {
    minTeilnehmer: 2,
    maxTeilnehmer: 8,
    apiEndpoint: '/api/gruppen-match',
};

// Sternzeichen mit Icons und Elementen
const STERNZEICHEN = [
    { value: 'widder',     icon: '♈', name: 'Widder',     element: 'feuer' },
    { value: 'stier',      icon: '♉', name: 'Stier',      element: 'erde' },
    { value: 'zwillinge',  icon: '♊', name: 'Zwillinge',  element: 'luft' },
    { value: 'krebs',      icon: '♋', name: 'Krebs',      element: 'wasser' },
    { value: 'loewe',      icon: '♌', name: 'Löwe',       element: 'feuer' },
    { value: 'jungfrau',   icon: '♍', name: 'Jungfrau',   element: 'erde' },
    { value: 'waage',      icon: '♎', name: 'Waage',      element: 'luft' },
    { value: 'skorpion',   icon: '♏', name: 'Skorpion',   element: 'wasser' },
    { value: 'schuetze',   icon: '♐', name: 'Schütze',    element: 'feuer' },
    { value: 'steinbock',  icon: '♑', name: 'Steinbock',  element: 'erde' },
    { value: 'wassermann', icon: '♒', name: 'Wassermann', element: 'luft' },
    { value: 'fische',     icon: '♓', name: 'Fische',     element: 'wasser' },
];

let teilnehmerAnzahl = 2;

// DOM Elements
const form = document.getElementById('gruppen-form');
const container = document.getElementById('teilnehmer-container');
const countDisplay = document.getElementById('count-display');
const btnMinus = document.getElementById('btn-minus');
const btnPlus = document.getElementById('btn-plus');
const budgetSlider = document.getElementById('budget');
const budgetValue = document.getElementById('budget-value');
const submitBtn = document.getElementById('submit-btn');
const loadingDiv = document.getElementById('loading');

/**
 * Erzeugt den Sternzeichen-Picker HTML
 */
function createZodiacPicker(index) {
    return STERNZEICHEN.map(sz => `
        <label class="zodiac-option" data-element="${sz.element}">
            <input type="radio" name="sternzeichen-${index}" value="${sz.value}" required>
            <span class="zodiac-btn">
                <span class="zodiac-icon">${sz.icon}</span>
                <span class="zodiac-name">${sz.name}</span>
            </span>
        </label>
    `).join('');
}

/**
 * Erstellt eine Teilnehmer-Karte
 */
function createTeilnehmerCard(index) {
    const card = document.createElement('div');
    card.className = 'teilnehmer-card';
    card.dataset.index = index;

    card.innerHTML = `
        <div class="card-header">
            <div class="card-number">${index + 1}</div>
            <span class="card-title">Reisende${index === 0 ? 'r' : '(r)'} ${index + 1}</span>
        </div>

        <div class="sternzeichen-picker">
            <label>Sternzeichen wählen</label>
            <div class="zodiac-grid">
                ${createZodiacPicker(index)}
            </div>
        </div>

        <div class="alter-group">
            <label for="alter-${index}">Gefühltes Alter</label>
            <input type="number" id="alter-${index}" name="alter-${index}"
                   class="alter-input" min="18" max="99" placeholder="35" required>
        </div>
    `;

    // Event Listener für Element-Visualisierung
    const radioInputs = card.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedSz = STERNZEICHEN.find(sz => sz.value === radio.value);
            if (selectedSz) {
                card.dataset.element = selectedSz.element;
            }
        });
    });

    return card;
}

/**
 * Rendert alle Teilnehmer-Karten
 */
function renderTeilnehmer() {
    // Bestehende Daten sichern
    const existingData = [];
    container.querySelectorAll('.teilnehmer-card').forEach((card, i) => {
        const selectedRadio = card.querySelector(`input[name="sternzeichen-${i}"]:checked`);
        const alter = card.querySelector(`#alter-${i}`)?.value;
        existingData.push({
            sternzeichen: selectedRadio?.value || null,
            alter: alter || null
        });
    });

    container.innerHTML = '';

    for (let i = 0; i < teilnehmerAnzahl; i++) {
        const card = createTeilnehmerCard(i);
        container.appendChild(card);

        // Daten wiederherstellen
        if (existingData[i]) {
            if (existingData[i].sternzeichen) {
                const radio = card.querySelector(`input[value="${existingData[i].sternzeichen}"]`);
                if (radio) {
                    radio.checked = true;
                    const selectedSz = STERNZEICHEN.find(sz => sz.value === existingData[i].sternzeichen);
                    if (selectedSz) card.dataset.element = selectedSz.element;
                }
            }
            if (existingData[i].alter) {
                card.querySelector(`#alter-${i}`).value = existingData[i].alter;
            }
        }

        // Verzögerte Animation für gestaffelten Effekt
        card.style.animationDelay = `${i * 0.1}s`;
    }

    // Button-States
    btnMinus.disabled = teilnehmerAnzahl <= CONFIG.minTeilnehmer;
    btnPlus.disabled = teilnehmerAnzahl >= CONFIG.maxTeilnehmer;
    countDisplay.textContent = teilnehmerAnzahl;
}

/**
 * Sammelt Formulardaten
 */
function collectFormData() {
    const teilnehmer = [];

    for (let i = 0; i < teilnehmerAnzahl; i++) {
        const selectedRadio = document.querySelector(`input[name="sternzeichen-${i}"]:checked`);
        const sternzeichen = selectedRadio?.value;
        const gefuehltesAlter = parseInt(document.getElementById(`alter-${i}`).value, 10);

        const szData = STERNZEICHEN.find(sz => sz.value === sternzeichen);

        teilnehmer.push({
            index: i + 1,
            sternzeichen,
            sternzeichenIcon: szData?.icon || '',
            sternzeichenName: szData?.name || '',
            element: szData?.element || 'unbekannt',
            gefuehltesAlter,
        });
    }

    return {
        email: document.getElementById('email').value,
        teilnehmerAnzahl,
        teilnehmer,
        praeferenzen: {
            budgetProPerson: parseInt(budgetSlider.value, 10),
            energieLevel: parseInt(document.getElementById('energie').value, 10),
            interessen: document.getElementById('interessen').value,
        },
        meta: {
            timestamp: new Date().toISOString(),
            version: '2.0-premium',
        }
    };
}

/**
 * Validierung
 */
function validateForm() {
    const email = document.getElementById('email').value;
    if (!email || !email.includes('@')) {
        showToast('Bitte gib eine gültige E-Mail-Adresse ein.');
        return false;
    }

    for (let i = 0; i < teilnehmerAnzahl; i++) {
        const selectedRadio = document.querySelector(`input[name="sternzeichen-${i}"]:checked`);
        const alter = document.getElementById(`alter-${i}`).value;

        if (!selectedRadio) {
            showToast(`Bitte wähle ein Sternzeichen für Reisende(r) ${i + 1}.`);
            highlightCard(i);
            return false;
        }

        if (!alter || alter < 18 || alter > 99) {
            showToast(`Bitte gib ein gültiges Alter für Reisende(r) ${i + 1} ein.`);
            highlightCard(i);
            return false;
        }
    }

    return true;
}

/**
 * Hebt eine Karte bei Fehler hervor
 */
function highlightCard(index) {
    const card = container.querySelector(`.teilnehmer-card[data-index="${index}"]`);
    if (card) {
        card.style.animation = 'none';
        card.offsetHeight; // Reflow
        card.style.animation = 'shake 0.5s ease';
    }
}

/**
 * Einfache Toast-Nachricht
 */
function showToast(message) {
    // Entferne bestehenden Toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #1e1b4b;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-size: 0.95rem;
        z-index: 1000;
        animation: toastIn 0.3s ease;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * API-Aufruf
 */
async function sendToAPI(data) {
    const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
    }

    return await response.json();
}

/**
 * Loading-State mit animierten Matching-Texten
 */
const LOADING_MESSAGES = [
    { text: 'Sterne werden ausgerichtet...', icon: '✨' },
    { text: 'Konstellationen analysieren...', icon: '🌌' },
    { text: 'Elemente harmonisieren...', icon: '🔮' },
    { text: 'Euer Match wird berechnet...', icon: '💫' },
    { text: 'Reiseziele durchsuchen...', icon: '🌍' },
    { text: 'Kosmische Verbindung herstellen...', icon: '⭐' },
];

let loadingInterval = null;
let messageIndex = 0;

function setLoading(isLoading) {
    if (isLoading) {
        form.style.display = 'none';
        loadingDiv.classList.add('active');
        submitBtn.disabled = true;

        // Animierte Loading-Texte starten
        messageIndex = 0;
        updateLoadingMessage();
        loadingInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
            updateLoadingMessage();
        }, 2500);
    } else {
        form.style.display = 'block';
        loadingDiv.classList.remove('active');
        submitBtn.disabled = false;

        // Interval stoppen
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
    }
}

function updateLoadingMessage() {
    const messageEl = document.getElementById('loading-message');
    const iconEl = document.getElementById('loading-icon');

    if (messageEl && iconEl) {
        const msg = LOADING_MESSAGES[messageIndex];

        // Fade-out
        messageEl.style.opacity = '0';
        iconEl.style.transform = 'scale(0.8) rotate(-10deg)';

        setTimeout(() => {
            messageEl.textContent = msg.text;
            iconEl.textContent = msg.icon;

            // Fade-in
            messageEl.style.opacity = '1';
            iconEl.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    }
}

/**
 * Erstellt das Loading-Overlay dynamisch
 */
function createLoadingOverlay() {
    const loadingHTML = `
        <div class="matching-animation">
            <div class="zodiac-orbit">
                <span class="orbit-icon">♈</span>
                <span class="orbit-icon">♉</span>
                <span class="orbit-icon">♊</span>
                <span class="orbit-icon">♋</span>
                <span class="orbit-icon">♌</span>
                <span class="orbit-icon">♍</span>
                <span class="orbit-icon">♎</span>
                <span class="orbit-icon">♏</span>
                <span class="orbit-icon">♐</span>
                <span class="orbit-icon">♑</span>
                <span class="orbit-icon">♒</span>
                <span class="orbit-icon">♓</span>
            </div>
            <div class="loading-center">
                <span id="loading-icon" class="loading-emoji">✨</span>
            </div>
        </div>
        <h3 id="loading-message" class="loading-text">Sterne werden ausgerichtet...</h3>
        <div class="loading-progress">
            <div class="progress-bar"></div>
        </div>
    `;

    if (loadingDiv) {
        loadingDiv.innerHTML = loadingHTML;
    }
}

/**
 * Formatierung
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Event Listeners
btnMinus.addEventListener('click', () => {
    if (teilnehmerAnzahl > CONFIG.minTeilnehmer) {
        teilnehmerAnzahl--;
        renderTeilnehmer();
    }
});

btnPlus.addEventListener('click', () => {
    if (teilnehmerAnzahl < CONFIG.maxTeilnehmer) {
        teilnehmerAnzahl++;
        renderTeilnehmer();
    }
});

budgetSlider.addEventListener('input', () => {
    budgetValue.textContent = formatNumber(budgetSlider.value);
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = collectFormData();
    console.log('Formulardaten:', formData);

    setLoading(true);

    try {
        const result = await sendToAPI(formData);
        console.log('API-Antwort:', result);

        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            showToast('Die Sterne haben gesprochen! Check deine E-Mails.');
            setLoading(false);
        }
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
        setLoading(false);
    }
});

// CSS für Animationen dynamisch hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }

    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }

    /* Matching Animation Styles */
    .matching-animation {
        position: relative;
        width: 160px;
        height: 160px;
        margin: 0 auto 2rem;
    }

    .zodiac-orbit {
        position: absolute;
        width: 100%;
        height: 100%;
        animation: orbit 20s linear infinite;
    }

    .orbit-icon {
        position: absolute;
        font-size: 1.2rem;
        opacity: 0.6;
        transition: opacity 0.3s, transform 0.3s;
    }

    .orbit-icon:nth-child(1)  { top: 0; left: 50%; transform: translateX(-50%); }
    .orbit-icon:nth-child(2)  { top: 6%; right: 20%; }
    .orbit-icon:nth-child(3)  { top: 25%; right: 3%; }
    .orbit-icon:nth-child(4)  { top: 50%; right: 0; transform: translateY(-50%); }
    .orbit-icon:nth-child(5)  { bottom: 25%; right: 3%; }
    .orbit-icon:nth-child(6)  { bottom: 6%; right: 20%; }
    .orbit-icon:nth-child(7)  { bottom: 0; left: 50%; transform: translateX(-50%); }
    .orbit-icon:nth-child(8)  { bottom: 6%; left: 20%; }
    .orbit-icon:nth-child(9)  { bottom: 25%; left: 3%; }
    .orbit-icon:nth-child(10) { top: 50%; left: 0; transform: translateY(-50%); }
    .orbit-icon:nth-child(11) { top: 25%; left: 3%; }
    .orbit-icon:nth-child(12) { top: 6%; left: 20%; }

    @keyframes orbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .loading-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
        animation: pulse-glow 2s ease-in-out infinite;
    }

    .loading-emoji {
        font-size: 2.5rem;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            box-shadow: 0 0 50px rgba(168, 85, 247, 0.6);
            transform: translate(-50%, -50%) scale(1.05);
        }
    }

    .loading-text {
        color: #1e1b4b;
        font-size: 1.25rem;
        font-weight: 500;
        text-align: center;
        margin-bottom: 1.5rem;
        transition: opacity 0.3s ease;
        min-height: 1.5em;
    }

    .loading-progress {
        width: 200px;
        height: 6px;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 3px;
        margin: 0 auto;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        width: 30%;
        background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
        background-size: 200% 100%;
        border-radius: 3px;
        animation: progress-slide 1.5s ease-in-out infinite;
    }

    @keyframes progress-slide {
        0% {
            transform: translateX(-100%);
            background-position: 0% 0%;
        }
        50% {
            background-position: 100% 0%;
        }
        100% {
            transform: translateX(400%);
            background-position: 0% 0%;
        }
    }

    /* Loading Container */
    .loading {
        display: none;
        padding: 3rem 2rem;
        text-align: center;
    }

    .loading.active {
        display: block;
        animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderTeilnehmer();
    createLoadingOverlay();
    budgetValue.textContent = formatNumber(budgetSlider.value);
});
