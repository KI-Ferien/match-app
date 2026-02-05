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
 * Loading-State
 */
function setLoading(isLoading) {
    if (isLoading) {
        form.style.display = 'none';
        loadingDiv.classList.add('active');
        submitBtn.disabled = true;
    } else {
        form.style.display = 'block';
        loadingDiv.classList.remove('active');
        submitBtn.disabled = false;
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
`;
document.head.appendChild(style);

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderTeilnehmer();
    budgetValue.textContent = formatNumber(budgetSlider.value);
});
