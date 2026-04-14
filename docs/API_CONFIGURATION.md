# ⚙️ Configurazione API - Google Gemini & Clerk

## 🤖 Google Gemini API (BYOK)

### Cos'è BYOK?
**BYOK = Bring Your Own Key**

Significa che **tu fornisci la tua chiave API Gemini**. L'app non ha un backend centralizzato che gestisce le chiavi - tu le gestisci direttamente nel tuo browser.

### Vantaggi
✅ **Gratis**: Non paghiamo servizi di terzi
✅ **Privato**: La tua chiave rimane nel tuo browser
✅ **Sicuro**: Inviata direttamente a Google via HTTPS
✅ **Scalabile**: Ogni utente usa i suoi crediti

### Come Ottenere Chiave Gemini

1. **Vai a [Google AI Studio](https://aistudio.google.com/app/apikey)**
2. **Clicca "Create API Key"**
3. Seleziona "**Create API key in new Google Cloud project**"
4. Copia la chiave (inizia con `AIza...`)
5. ✅ È **GRATIS** per uso non-commerciale

### Come Usarla nell'App

#### Via UI (Consigliato)
1. Apri Wacademy
2. Header → Bottone lock/key (accanto dark mode)
3. Incolla la chiave nel campo
4. Clicca **"Salva"**
5. ✅ Salvata in localStorage

#### Via .env.local (Development)
```env
# .env.local
GEMINI_API_KEY=AIzaSyD6jIb3DhWai4TRo-kxjZyseX7pDrMqfXk
```

⚠️ **Nota**: Non usiamo GEMINI_API_KEY in produzione (Netlify)
- E il BYOK (porta chiave da browser)Viene inviata direttamente a Google, non al nostro backend

### Sicurezza Chiave Gemini

```
🔐 Flusso di Sicurezza:
┌─────────────────┐
│  Tu (Browser)   │
├─────────────────┤
│ Chiave locale   │
│ (localStorage)  │
└────────┬────────┘
         │
         │ HTTPS (Crittografato)
         ▼
    ┌─────────────────────┐
    │  Google Gemini API  │
    │  (AI Processing)    │
    └─────────────────────┘
         │
         │ JSON Response
         ▼
┌─────────────────┐
│  Tu (Browser)   │
│  ...Risultati   │
└─────────────────┘

❌ I nostri server NON vedono la chiave
✅ Solo Google vede la richiesta (come dovrebbe)
```

### Limiti di Utilizzo

Google Gemini Free Tier ha limiti:
- 60 richieste/minuto
- 1M token totali/mese (gratis)
- Per usi commerciali: Upgrade a Gemini Pro (a pagamento)

Se superi limiti:
- Errore: "Quota exceeded"
- **Soluzione**: Upgrade su Google Cloud Console

---

## 🔐 Clerk Authentication

### Cos'è Clerk?
Servizio di **autenticazione e gestione utenti** (come Auth0, Firebase Auth)

- Sign-up / Sign-in
- Profilo utente
- Session management
- Multi-factor authentication (opzionale)

### Come Creare Applicazione Clerk

1. **Vai a [Clerk.com](https://clerk.com)** → Signup gratuito
2. **Crea Organization** (es. "Wacademy")
3. **Crea Application** (es. "Wacademy Web App")
4. Scegli:
   - ✅ Email + Password (default)
   - ✅ OAuth providers (Google, GitHub, etc. - opzionale)
5. → Verrai reindirizzato a **API Keys**

### Ottenere le Chiavi

#### Publishable Key (Pubblica - Sicura per Client)
1. **Clerk Dashboard** → **API Keys**
2. Sezione "Publishable key"
3. Copia il valore (inizia con `pk_test_`)
4. ✅ Sicura da exporre (client-side)

#### Secret Key (Privata - SOLO Server)
1. Sempre in **API Keys**
2. Sezione "Secret key"
3. ⚠️ **NON usare nel client** - solo backend
4. ❌ Non committare mai su Git

### Configurazione nell'App

#### Development (.env.local)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tdGFkcG9sZS00NC5jbGVyay5hY2NvdW50cy5kZXYk
```

#### Production (Netlify)
**Settings** → **Environment** → **Add variable**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tdGFkcG9sZS00NC5jbGVyay5hY2NvdW50cy5kZXYk
```

### Flusso di Autenticazione

```
┌──────────────────────────┐
│   Anonimo (No Login)     │
├──────────────────────────┤
│  ❌ Non può generate quiz │
│  ❌ Non può fare export   │
│  ✅ Vede homepage         │
└────────────┬─────────────┘
             │ Clicca "Sign in"
             ▼
┌──────────────────────────┐
│  Clerk Login Form        │
├──────────────────────────┤
│  Email + Password        │
│  (o OAuth: Google/GitHub)│
└────────────┬─────────────┘
             │ Credenziali valide
             ▼
┌──────────────────────────┐
│   Utente Autenticato     │
├──────────────────────────┤
│  ✅ Può generare quiz     │
│  ✅ Può fare export       │
│  ✅ Sessione persistente  │
│  ✅ Vede profilo utente   │
└──────────────────────────┘
```

### Aggiungere OAuth Providers (Google, GitHub)

Nel Clerk Dashboard:

1. **Authenticators** → **Social Connections**
2. Seleziona **Google** (opzionale)
3. Fornisci credenziali Google OAuth
4. Abilita per l'app

✅ Utenti potranno fare "Sign in with Google"

---

## 🎯 Configurazione per Netlify Deploy

### Variabili da Aggiungere

**Netlify Dashboard** → **Settings** → **Environment**

```
Nome:  VITE_CLERK_PUBLISHABLE_KEY
Valore: pk_test_Y2hhbXBpb24tdGFkcG9sZS00NC5jbGVyay5hY2NvdW50cy5kZXYk
```

⚠️ **Nota importante**:
- `VITE_` prefix rende disponibile al client (pubblico)
- È SICURO perché è Publishable Key (non secret)
- `GEMINI_API_KEY` NON va in environment (BYOK dal browser)

### Netlify Build Settings

Già configurati in `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  SECRETS_SCAN_ENABLED = "false"  # Disable scanner for public key
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

✅ Auto-rilevat da Netlify - niente da configurare

---

## 🔧 Troubleshooting API

### ❌ "Detected Dubious Ownership"
```bash
# Soluzione Git
git config --global --add safe.directory F:/wacademy
```

### ❌ Gemini: "Invalid API Key"
- Verifica chiave copiata completamente
- Genera nuova chiave da [Google AI Studio](https://aistudio.google.com/app/apikey)
- Incolla nuovo valore

### ❌ Clerk: "Invalid Publishable Key"
- Assicurati di usare **Publishable Key** (inizia con `pk_test_`)
- Non usare Secret Key (inizia con `sk_test_`)
- Verifica su **Clerk Dashboard** → **API Keys**

### ❌ Build fallisce "VITE_CLERK_PUBLISHABLE_KEY undefined"
- Verifica variabile in Netlify Environment
- Redeploy sito dopo aggiunta variabile
- Cancella cache Netlify e redeploy

### ❌ "Rate limit exceeded" da Gemini
- Utilizzo quota libera esaurito
- Upgrade a Gemini Pro o aspetta reset mensile
- Vedi limiti [qui](https://ai.google.dev/pricing)

---

## 📚 Link Utili

- 🔗 [Google Generative AI Docs](https://ai.google.dev/docs)
- 🔗 [Clerk Documentation](https://clerk.com/docs)
- 🔗 [SCORM Standard](https://scorm.com/)
- 🔗 [React Clerk Integration](https://clerk.com/docs/quickstarts/react)

---

**Tutto configurato? Procedi con [DEPLOYMENT.md](./DEPLOYMENT.md)! 🚀**
