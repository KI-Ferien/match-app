/**
 * match.js - Logik für KI-Ferien.de Astro-Konzept
 */

// Travelpayouts Konfiguration
const TP_PROJECT_ID = "492044";
const TP_PARTNER_ID = "698672";

const zodiacConfigs = {
    widder: { title: "Widder Energie", text: "Feurige Abenteuer und Action-Ferien warten auf dich.", path: "/widder" },
    stier: { title: "Stier Genuss", text: "Erlebe pure Entspannung und Kulinarik in der Natur.", path: "/stier" },
    zwillinge: { title: "Zwillinge Spirit", text: "Entdecke pulsierende Metropolen und Astro-Events.", path: "/zwillinge" },
    krebs: { title: "Krebs Romantik", text: "Traumhafte Ferienhäuser direkt am Wasser finden.", path: "/krebs" },
    loewe: { title: "Löwen Glanz", text: "Luxuriöse Destinationen unter goldenem Sternenlicht.", path: "/loewe" },
    jungfrau: { title: "Jungfrau Fokus", text: "Klare Sicht und perfekte Organisation für deine Reise.", path: "/jungfrau" },
    waage: { title: "Waage Balance", text: "Stilvolle Unterkünfte in harmonischer Umgebung.", path: "/waage" },
    skorpion: { title: "Skorpion Mystik", text: "Geheimnisvolle Orte für tiefgründige Erlebnisse.", path: "/skorpion" },
    schuetze: { title: "Schützen Fernweh", text: "Große Expeditionen zu den dunklen Himmeln der Welt.", path: "/schuetze" },
    steinbock: { title: "Steinbock Ruhe", text: "Gipfelmomente und absolute Stille in den Bergen.", path: "/steinbock" },
    wassermann: { title: "Wassermann Vision", text: "Innovative Glamping-Konzepte für Sternengucker.", path: "/wassermann" },
    fische: { title: "Fische Träumerei", text: "Magische Inselferien zwischen Meer und Unendlichkeit.", path: "/fische" }
};

let currentPath = "";

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.zodiac-card');
    const ballTitle = document.getElementById('ball-title');
    const ballText = document.getElementById('ball-text');
    const ball = document.getElementById('main-ball');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Aktiven Status bei Karten umschalten
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const sign = card.getAttribute('data-sign');
            const info = zodiacConfigs[sign];

            // Glaskugel Inhalt aktualisieren
            ballTitle.innerText = info.title;
            ballText.innerText = info.text;
            currentPath = info.path;

            // Kleiner visueller Feedback-Effekt
            ball.style.transform = "scale(1.05)";
            setTimeout(() => {
                ball.style.transform = "scale(1)";
            }, 200);
        });
    });
});

function redirectAstro() {
    if (!currentPath) {
        alert("Bitte wähle zuerst dein Sternzeichen aus!");
        return;
    }

    // Erstellt den finalen Link inklusive deiner Travelpayouts Partner-ID
    // Nutzt das Verzeichnis /astro als Basis
    const finalUrl = `https://ki-ferien.de/astro${currentPath}?marker=${TP_PARTNER_ID}`;
    
    console.log("Navigiere zu:", finalUrl);
    window.location.href = finalUrl;
}
