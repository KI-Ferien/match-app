// reise.js

const resultRaw = sessionStorage.getItem('orakelResult');

if (!resultRaw) {
  document.getElementById('destTitle').textContent = 'Keine Empfehlung gefunden';
  document.getElementById('explanation').textContent = 'Bitte kehre zurück und befrage das Orakel.';
  document.getElementById('ctaRow').style.display = 'none';
} else {
  const { payload, result } = JSON.parse(resultRaw);
  
  const dest = result.destination || 'Unbekanntes Ziel';
  document.getElementById('destTitle').textContent = dest;
  
  const signsString = Array.isArray(payload.signs) ? payload.signs.join(', ') : payload.signs;
  document.getElementById('destSub').textContent = `${payload.participants} Reisende (${signsString}) · ${payload.vibe} · ${payload.budget}`;
  
  document.getElementById('explanation').textContent = result.explanation || '';
  document.getElementById('bestTime').textContent = result.bestTimeTip || '';
  
  const packlistEl = document.getElementById('packlist');
  (result.packliste || []).forEach(item => {
    const li = document.createElement('li'); 
    li.textContent = item; 
    packlistEl.appendChild(li);
  });

  const primary = document.getElementById('primaryCta');
  primary.textContent = result.cta_text || 'Ferien planen & Erlebnisse prüfen';

  const cards = document.getElementById('affiliateCards');
  const suggestions = result.affiliate_suggestions || [];
  
  suggestions.forEach((a) => {
    const div = document.createElement('div'); 
    div.className = 'card';
    
    let icon = '🎟️';
    if (a.type === 'activity') icon = '🗺️'; 
    if (a.type === 'transfer') icon = '🚕'; 
    if (a.type === 'pickup') icon = '🚙'; 
    
    div.innerHTML = `
      <strong>${icon} ${a.label}</strong>
      <button data-url="${a.affiliate_url}" class="affBtn">Jetzt ansehen</button>
    `;
    cards.appendChild(div);
  });

  primary.addEventListener('click', () => {
    if (suggestions.length > 0 && suggestions[0].affiliate_url) {
      // Öffnet den Klook-Link (Erlebnisse) als Hauptaktion
      window.open(suggestions[0].affiliate_url, '_blank');
    } else {
      alert('Angebote werden geladen.');
    }
  });

  document.querySelectorAll('.affBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetUrl = e.currentTarget.getAttribute('data-url');
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
    });
  });
}