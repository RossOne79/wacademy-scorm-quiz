# 🎓 Wacademy - SCORM Quiz Generator

**Wacademy** è un'applicazione web potente e intuitiva che automatizza la generazione di quiz interattivi SCORM da contenuti video utilizzando l'intelligenza artificiale Google Gemini.

## ✨ Caratteristiche Principali

### 🤖 Generazione Automatica Quiz con AI
- Analizza automaticamente i contenuti video
- Genera domande a scelta multipla e vero/falso
- Crea obiettivi di apprendimento
- Classifica per difficoltà e livello cognitivo
- Supporta trascrizioni video (italiano)

### 📝 Gestione Avanzata dei Quiz
- **Selezione selettiva**: Scegli quali domande includere
- **Drag-and-drop**: Riordina le domande per priorità
- **Modifica inline**: Correggi testi e obiettivi al volo
- **Filtri avanzati**: Per difficoltà (facile/media/difficile) e tipo
- **Timestamp video**: Collega domande a segmenti specifici

### 📦 Export SCORM Completo
- **SCORM 1.2**: Compatibilità massima con LMS legacy
- **SCORM 2004 3rd Edition**: Standard moderno
- **Configurazione**: Titolo, numero domande, punteggio minimo, tentativi
- **Anteprima browser**: Testa il corso prima di scaricare

### 🎨 Tema Personalizzabile
- **Colori**: Scegli il colore primario con picker esadecimale
- **Stili bottoni**: Filled, outline, gradient
- **Bordi**: Sharp, medium, pill
- **Font**: System, serif, monospace
- **Dimensioni**: Small, medium, large
- **Salva preset**: Crea e riusa temi personalizzati

### 💾 Persistenza Dati
- **Auto-save**: Salva automaticamente il lavoro
- **Cronologia sessioni**: Ripristina ultimi lavori
- **Cronologia quiz**: Accedi alle generazioni precedenti
- **Dark mode**: Supporto completo tema scuro

### 🔐 Autenticazione Sicura
- **Clerk Integration**: Gestione utenti professionale
- **Sign-up/Sign-in**: Registrazione e login intuitivi
- **Profilo utente**: Gestione account integrata
- **Session management**: Sessioni sicure e persistenti

---

## 🚀 Deploy Netlify

### **URL Live**
🌐 **https://wacademy-scorm-quiz.netlify.app**

### **Variabili d'Ambiente Netlify**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tdGFkcG9sZS00NC5jbGVyay5hY2NvdW50cy5kZXYk
```

---

## 🛠️ Setup Locale

### **Prerequisiti**
- Node.js v20+ (scarica da [nodejs.org](https://nodejs.org))
- Git
- Chiave API Gemini (gratis da [Google AI Studio](https://aistudio.google.com/app/apikey))
- Chiave Clerk Publishable (da [Clerk Dashboard](https://dashboard.clerk.com))

### **Installazione**

```bash
# Clone repository
git clone https://github.com/RossOne79/wacademy-scorm-quiz.git
cd wacademy-scorm-quiz

# Installa dipendenze
npm install

# Configura variabili d'ambiente
echo 'GEMINI_API_KEY=YOUR_KEY' > .env.local
echo 'VITE_CLERK_PUBLISHABLE_KEY=YOUR_KEY' >> .env.local

# Avvia dev server
npm run dev
# Accedi a http://localhost:5173
```

---

## 📋 Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| **Frontend** | React 19 + TypeScript 5.8 |
| **Build** | Vite 6.2 |
| **Styling** | Tailwind CSS 3 |
| **AI/APIs** | Google Gemini 2.5-flash, Clerk |
| **Packaging** | JSZip (SCORM) |
| **Hosting** | Netlify |

---

## 📁 Struttura Cartelle

```
wacademy/
├── components/              # Componenti React
│   ├── UploadStep.tsx       # Caricamento video
│   ├── GenerateStep.tsx     # Generazione quiz
│   ├── PackageStep.tsx      # Export SCORM
│   ├── Header.tsx           # Barra superiore
│   ├── ProgressBar.tsx      # Progress indicator
│   └── ...
├── contexts/                # React Contexts
│   ├── SessionContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── services/                # Business logic
│   ├── geminiService.ts
│   ├── geminiKeyStorage.ts
│   └── scormService.ts
├── netlify/functions/       # Serverless (opzionale)
├── docs/                    # Documentazione
├── App.tsx
├── index.tsx
└── package.json
```

---

## 🔄 Workflow 3-Step

### **Step 1: Upload Media**
- Carica video (MP4/WebM)
- Allega trascrizione (facoltativo)
- Scegli di generare quiz con AI

### **Step 2: Genera Quiz**
- AI crea 20 domande + obiettivi
- Seleziona domande da includere
- Modifica e riordina con drag-drop
- Filtra per difficoltà

### **Step 3: Pacchetto SCORM**
- Configura impostazioni corso
- Scegli SCORM version (1.2 o 2004)
- Esporta file .zip pronto per LMS

---

## 🔐 Configurazione API

### **Google Gemini** (BYOK)
1. Ottieni chiave da [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Incolla nel bottone lock/key nell'app
3. Salva in localStorage (solo nel tuo browser)

### **Clerk Authentication**
1. Crea app su [Clerk.com](https://clerk.com)
2. Copia Publishable Key
3. Configura in `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

---

## 🧪 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

---

## 📚 Documentazione

- **[SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Guida installazione dettagliata
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deploy su Netlify
- **[USER_GUIDE.md](./docs/USER_GUIDE.md)** - Manuale utente

---

## 🤝 Support

- 📝 Issues: [GitHub Issues](https://github.com/RossOne79/wacademy-scorm-quiz/issues)
- 💬 Discussioni: [GitHub Discussions](https://github.com/RossOne79/wacademy-scorm-quiz/discussions)

---

## 📄 Licenza

MIT License © 2026 Wacademy

---

**Trasformiamo video in corsi interattivi SCORM con IA! 🚀**
- ✅ Fine-grained content control
- ✅ Auto-save and generation history
- ✅ Dark mode support

## 📄 License

MIT
