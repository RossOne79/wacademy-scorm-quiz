# 📖 Guida Setup Locale

## 🔧 Installazione Passo-Passo

### Prerequisiti

Assicurati di avere installato:
- **Node.js 20+** ([Download](https://nodejs.org))
- **Git** ([Download](https://git-scm.com))
- **Un editor di testo** (VS Code, Sublime, etc.)

Verifica le versioni:
```bash
node --version    # v20.x.x o superiore
npm --version     # 10.x.x o superiore
git --version     # 2.x.x o superiore
```

---

### Step 1: Clone il Repository

```bash
git clone https://github.com/RossOne79/wacademy-scorm-quiz.git
cd wacademy-scorm-quiz
```

---

### Step 2: Installa Dipendenze

```bash
npm install
```

Questo scaricherà tutti i pacchetti necessari in `node_modules/` (~500MB)

---

### Step 3: Configura Variabili d'Ambiente

Crea file `.env.local` nella root del progetto:

```bash
# Linux/Mac
touch .env.local

# Windows PowerShell
New-Item -Path ".env.local" -ItemType File
```

Aggiungi contenuto:
```env
# Google Gemini API Key
# Ottieni da: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Clerk Publishable Key (PUBBLICA - sicura per client)
# Ottieni da: https://dashboard.clerk.com/ → API Keys
VITE_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_KEY_HERE

# Endpoint reporting SCORM incorporato nel pacchetto generato
VITE_SCORM_REPORTING_ENDPOINT=https://YOUR-SITE.netlify.app/.netlify/functions/scorm-events
```

⚠️ **IMPORTANTE**: Non committare `.env.local` su Git!

---

### Step 4: Avvia Dev Server

```bash
npm run dev
```

Output:
```
  VITE v6.4.1  ready in 2233 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Apri http://localhost:5173 nel browser 🎉

---

## Comandi Disponibili

```bash
# Development server (hot reload)
npm run dev

# Build per produzione
npm run build

# Preview build localmente
npm run preview

# Verifica errori TypeScript
npx tsc --noEmit
```

---

## Struttura Cartelle Importante

```
wacademy/
├── .env.local              # ⚠️ Le tue credenziali (NON committare!)
├── src/
│   ├── App.tsx            # Componente principale
│   ├── index.tsx          # Entry point React
│   ├── components/        # Componenti React
│   ├── contexts/          # React Context Providers
│   ├── services/          # Logica business
│   └── types.ts           # TypeScript interfaces
├── public/                # File statici
├── docs/                  # Documentazione
├── package.json           # Dipendenze
├── vite.config.ts         # Configurazione Vite
└── tsconfig.json          # Configurazione TypeScript
```

---

## Troubleshooting Setup

### ❌ "Module not found"
```bash
# Soluzione: Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Port 5173 already in use"
```bash
# Soluzione: Usa porta diversa
npm run dev -- --port 3000
```

### ❌ Errore "#include <...>"
```bash
# Soluzione: Aggiorna Node.js a v20+
node --version
```

### ❌ Clerk login non funziona
1. Verifica `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`
2. Assicurati che sia la Publishable Key, non Secret
3. Riavvia dev server dopo cambio `.env.local`

### ❌ Reporting SCORM non funziona
1. Verifica `VITE_SCORM_REPORTING_ENDPOINT` in `.env.local`
2. Controlla che il sito Netlify abbia fatto redeploy dopo le env vars
3. Rigenera il pacchetto SCORM dopo il deploy
4. Verifica tabelle e RPC in Supabase

### ❌ Gemini API key non riconosciuta
1. Ottieni nuova key da [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Incolla nel bottone lock/key nell'app (NON in `.env.local`)
3. La key viene salvata nel localStorage del browser

---

## Workflow di Sviluppo

1. **Modifica codice** → Hot reload automatico ✨
2. **Salva file** → Browser auto-refresh
3. **Apri DevTools** (F12)
4. **Controlla Console** per errori
5. **Commit changes** periodicamente:
   ```bash
   git add .
   git commit -m "Feature description"
   git push origin main
   ```

---

## Testing Locale

### Test Feature
1. Carica un video test (MP4 piccolo)
2. Genera quiz con Gemini
3. Verifica gestione domande
4. Esporta SCORM
5. Controlla file .zip generato
6. Se usi reporting: clicca `Test reporting` e controlla Supabase

### Dark Mode
- Clicca icona luna nell'header per toggle
- Verifica contrasti e readability

### Responsive Design
- Premi F12 → Toggle Device Toolbar
- Testa on mobile, tablet, desktop

---

## Note Importanti

✅ **Online**: L'app usa localStorage + localStorage per dati utente
⚠️ **Sessione**: Dati persistono solo sul device attuale
🔐 **Privacy**: Chiave Gemini salvata SOLO nel tuo browser

---

## Prossimi Step

- ✅ Setup completato
- 📝 [Leggi USER_GUIDE.md](./USER_GUIDE.md) per features
- 🚀 [Deploy su Netlify](./DEPLOYMENT.md)
- 💬 Contribuisci con pull requests!

---

**Hai domande? Apri un issue su GitHub! 😊**
