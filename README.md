## 🌍 KI-Ferien.de | Psychografisches Reise-Matching-Tool

![Status: MVP Production Ready](https://img.shields.io/badge/Status-MVP%20Production%20Ready-green)
![Tech Stack: Netlify | Mistral AI](https://img.shields.io/badge/Tech%20Stack-Netlify%20%7C%20Mistral%20AI-blue)

**Kurzbeschreibung:** Der KI-Ferien.de Funnel nutzt eine Serverless-Architektur, um tiefgreifende psychografische Präferenzen von Reisenden zu erfassen und diese mittels Large Language Model (LLM) mit dem idealen Urlaubstyp abzugleichen.

---

## 🎯 1. Projektziel & Wert

Dieses Projekt ist der **Minimum Viable Product (MVP)** Lead-Funnel für KI-Ferien.de.

* **Zweck:** Bereitstellung eines hochperformanten, kostenoptimierten Endpunkts zur Umwandlung von qualitativem Nutzer-Input (Sehnsüchte, Adjektive) in quantifizierbare Matching-Vektoren.
* **Nutzen:** Erhöhung der Lead-Qualität durch prädiktive KI-Analyse, welche die **emotionale Absicht** des Nutzers erkennt und damit die Grundlage für die nachgelagerte Fuzzy Logic schafft.

---

## ⚙️ 2. Architektur und Workflow (Serverless Jamstack)

Die Anwendung ist als Serverless-Funnel konzipiert, um maximale Geschwindigkeit und minimale Betriebskosten (im Free Tier) zu gewährleisten.

1.  **Frontend (Landingpage):**
    * Erstellt in reinem **HTML/CSS/JS**.
    * Gehostet über **Netlify (CDN)** für blitzschnelle Ladezeiten.
2.  **Daten-Erfassung:**
    * Genutzt wird **Netlify Forms**, um die Formular-Submissions direkt zu speichern.
3.  **Backend-Analyse:**
    * Der `submission-created`-Event in Netlify triggert eine **Netlify Function** (Serverless).
    * Diese Funktion ruft die **Mistral AI API** auf und sendet den Prompt mit den Freitext-Antworten.
4.  **Matching-Logik:**
    * Die LLM-Antwort (saubere Vektoren) wird empfangen.
    * **Fuzzy Logic** (im selben Serverless-Skript) gleicht die Vektoren mit den verfügbaren Reise-Angebotsprofilen ab.
5.  **Ergebnis:**
    * Der Nutzer wird zur personalisierten Ergebnisseite weitergeleitet.

---

## 📊 3. Eingabedaten und Analyse-Vektoren

Das Formular in `index.html` liefert folgende Schlüssel-Inputs zur KI-Analyse:

| Feldname | Typ | Zweck |
| :--- | :--- | :--- |
| `q_sehnsucht` | Freitext (`textarea`) | Qualitative Analyse des emotionalen Bedarfs (LLM-Sentiment-Analyse). |
| `q_activity` | Range Slider (1-5) | Quantitativer Vektor: Ruhe (1) vs. Action (5). |
| `q_social` | Range Slider (1-5) | Quantitativer Vektor: Abgeschiedenheit (1) vs. Gemeinschaft (5). |
| `q_adjektive` | Freitext (`text`) | Vektorisierung der drei gewünschten Urlaubs-Adjektive. |
| `email` | E-Mail | Lead-Generierung und Kommunikation des Ergebnisses. |

---

## 🚀 4. Lokales Setup und Deployment

### Voraussetzungen

* Node.js und npm (für Netlify Functions)
* GitHub-Konto (für Netlify-Verbindung)
* Mistral AI API Key

### Deployment

Dieses Repository ist mit Netlify verbunden. Jede Zusammenführung (Merge) in den `main`-Branch löst ein automatisches Deployment aus.

1.  **Clone Repository:** `git clone https://aws.amazon.com/de/what-is/repo/`
2.  **Install Netlify CLI:** `npm install netlify-cli -g`
3.  **Lokal testen:** `netlify dev`
4.  **Änderungen pushen:** `git add . && git commit -m "feat: [Ihre Änderung]" && git push origin main`

### Wichtige Dateien

| Datei | Zweck |
| :--- | :--- |
| `index.html` | Die Landingpage mit dem Netlify Forms Formular. |
| `netlify/functions/match.js` | Die **Serverless Function** (Back-End-Logik, LLM-Aufruf, Fuzzy Logic). |

---

## 🔒 5. Autor und Support

Dieses Projekt wird verwaltet von **Mikostro@web.de**.
