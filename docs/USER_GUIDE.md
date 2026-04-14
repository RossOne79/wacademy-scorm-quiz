# 👤 Guida Utente - Wacademy

## 🎯 Come Usare Wacademy

### Step 1️⃣: Upload Video

#### Un video da un file local
1. **Clicca "Carica un file"** nella sezione upload
2. Seleziona un video **MP4 o WebM** (max 500MB)
3. *(Opzionale)* Allega trascrizione in `.txt` per risultati migliori
4. **Opzione "Genera quiz con AI"** se marcata, IA analizzerà il video
5. Clicca **"Analizza Contenuto e Procedi"**

### Step 2️⃣: Genera Quiz con AI

L'IA (Google Gemini) analizzerà il video e genererà automaticamente:
- 📚 **5-8 Obiettivi di Apprendimento**
- 📝 **20 Domande** diversificate per:
  - **Difficoltà**: 50% facile, 35% media, 15% difficile
  - **Tipo**: Scelta multipla (4 opzioni) o Vero/Falso
  - **Livello cognitivo**: Rievocazione, Comprensione, Applicazione

#### Gestisci le Domande

1. **Seleziona/Deseleziona**
   - Checkbox accanto a ogni domanda
   - "*Seleziona Tutto*" per selezionare tutte
   - "*Deseleziona*" per svuotare la selezione

2. **Filtra per Difficoltà**
   - Dropdown: Tutte / Facile / Media / Difficile
   - Mostra solo le domande che vuoi

3. **Filtra per Tipo**
   - Dropdown: Tutti i tipi / Scelta Multipla / Vero-Falso
   - Combina con filtro difficoltà

4. **Riordina Domande** (Drag & Drop)
   - Clicca e trascina una domanda verso l'alto/basso
   - L'ordine si aggiorna in tempo reale
   - Perfetto per prioritizzare domande importanti

5. **Modifica Domande**
   - Clicca "**Modifica**" su una domanda
   - Edita il testo della domanda
   - Clicca "✓" per salvare

6. **Modifica Obiettivi**
   - Clicca "**Modifica**" su un obiettivo
   - Correggi il testo
   - Clicca "✓" per salvare

7. **Rigenera**
   - Se risultati non soddisfano
   - Clicca "**Rigenera**"
   - IA crea 20 nuove domande

---

### Step 3️⃣: Pacchetto SCORM

#### Configura Impostazioni Corso

| Impostazione | Opzioni | Note |
|---|---|---|
| **Titolo del Corso** | Testo libero | Default: nome file video |
| **Versione SCORM** | 1.2 / 2004 3ª Ed. | 1.2 per LMS legacy, 2004 per moderni |
| **Numero Domande** | 5 / 10 / 15 / 20 | Max: numero domande disponibili |
| **Punteggio di Superamento** | 0-100% | Default: 80% |
| **Ordine Casuale** | ON/OFF | Se ON: domande in ordine random per ogni tentativo |
| **Controlli Video Nativi** | ON/OFF | Se ON: play/pause/seek; se OFF: solo play/pause |
| **Limite Tentativi** | Numero | 0 = infiniti |

#### Anteprima Corso
- Visualizza thumbnail video
- Mostra informazioni corso
- Numero domande incluse

#### Esporta

- **"Esporta Pacchetto SCORM"**
  - Genera file `.zip` pronto per LMS
  - Contiene: video, HTML, manifest, quiz
  - Download automatico

- **"Testa nel Browser"**
  - Apre il corso in pop-up
  - Testa esperienza utente senza scaricare
  - Utile per verificare prima di caricare su LMS

---

## 🔐 Autenticazione & Profilo

### Login/Signup
1. **Non sei loggato?** Vedi **"Sign in"** button in alto
2. Clicca **"Sign in"** per accedere o registrarti
3. Clerk gestisce tutto (email, password, OAuth)

### Profilo Utente
- Clicca **bottone profilo** (alto a destra)
- Opzioni:
  - Visualizza profilo
  - Gestisci account
  - **Sign out** per logout

### Note Privacy
- ✅ Dati sessione salvati **localmente** sul tuo device
- ✅ Chiave Gemini salvata **solo nel tuo browser** (localStorage)
- ✅ Non viene inviato ai nostri server
- ⚠️ Se cancelli cache browser, dati locali si perdono

---

## 🎨 Personalizzazione Tema

### Apri Personalizzatore Tema
- Header → Clicca icona **palette colori** (accanto dark mode)

### Opzioni Disponibili

| Opzione | Scelte |
|---------|--------|
| **Colore Primario** | Color picker (esadecimale) |
| **Stile Bottoni** | Filled / Outline / Gradient |
| **Forma Bottoni** | Square / Medium / Pill |
| **Font** | System / Serif / Monospace |
| **Dimensione Font** | Small / Medium / Large |

### Salva Preset
1. Configura tema come preferisci
2. Clicca **"Salva come Preset"**
3. Dai un nome (es. "Tema Azienda")
4. Nome salvato nella lista preset

### Ripristina Preset
- Dropdown "**Tema Salvati**"
- Seleziona un preset per applicarlo
- Clicca **"Elimina"** per rimuovere

### Reset a Default
- Clicca **"Ripristina Tema"**
- Torna a colori/stili original

---

## 🌙 Dark Mode

### Toggle
- Header → Clicca icona **sole/luna** (accanto API key)
- Auto-cambia tema scuro/chiaro

### Preferenza Sistema
- Se nessuna preferenza manuale
- Usa impostazione sistema operativo

---

## 🔑 Configurazione Google Gemini API

1. **Dove trovare la chiave?**
   - Vai a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Crea/copia una chiave gratis

2. **Dove incollarla?**
   - Header → Clicca bottone **lock/key** (accanto dark mode)
   - Incolla la chiave nel campo
   - Clicca **"Salva"**

3. **Sicurezza**
   - ✅ Chiave salvata **SOLO nel tuo browser** (localStorage)
   - ✅ NON inviata ai nostri server
   - ✅ Inviata direttamente a Google quando generi quiz
   - ⚠️ Se non fidata, NON usare; ognuno porta chiave propria

4. **Come cambiarla?**
   - Clicca bottone lock/key
   - Modifica chiave nel campo
   - Clicca **"Aggiorna"**

---

## 📊 Cronologia & Sessioni

### Auto-Save
- Ogni modifica viene salvata automaticamente in **localStorage**
- Se chiudi tab/browser, puoi riprendere da dove eri

### Ripristina Sessione Precedente
- Al riavvio, se c'è una sessione salvata:
  - Pop-up: "Sessione Precedente Trovata"
  - Scegli **"Ripristina"** o **"Nuova Sessione"**

### Visualizza Cronologia Quiz
- Header → Clicca **history icon** (se present)
- Mostra ultimi 20 quiz generati
- Clicca per ripristinare uno

---

## 🐛 Troubleshooting di Utilizzo

### ❌ Gemini genera domande non rilevanti
**Soluzione**: 
- Allega trascrizione video per risultati migliori
- Se senza trascrizione, IA inferisce da titolo + durata

### ❌ Domande duplicate
**Soluzione**:
- Clicca "Rigenera"
- IA genera nuovo set

### ❌ Export SCORM non scarica
**Soluzione**:
1. Controlla blocco pop-up browser
2. Riprova con browser diverso (Chrome consigliato)
3. Testa file in browser prima

### ❌ Dark mode non salva
**Soluzione**:
- localStorage potrebbe essere disabilitato
- Controlla impostazioni privacy browser

### ❌ Login non funziona
**Soluzione**:
1. Verifica email insnerita
2. Controlla spam/posta indesiderata
3. Prova logout + login nuovamente

---

## 💡 Tips & Tricks

✅ **Trascrizione = Migliori Risultati**
- Se possibile, carica trascrizione video
- Video sottotitolato? Estrai sottotitoli

✅ **Filtra Prima di Esportare**
- Escludi domande poco rilevanti
- Export SCORM avrà solo domande selezionate

✅ **Verifica su LMS Prima**
- Usa "Testa nel Browser"
- Controlla quiz antes di caricare su LMS

✅ **Salva Tema per Brand**
- Personalizza colori aziendali
- Salva preset per riuso rapido

✅ **Backup Locale**
- File SCORM .zip = backup del corso
- Conserva per riusi futuri

---

## 🚀 Prossimi Step

- ✅ Setup completato
- 📝 [Leggi DEPLOYMENT.md](./DEPLOYMENT.md) per deploy Netlify
- 💬 Suggerimenti? Issues su GitHub!

---

**Buona creazione di corsi! 🎓**
