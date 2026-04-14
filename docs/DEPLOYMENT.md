# 🚀 Guida Deploy su Netlify

## Setup Rapido (5 minuti)

### 1️⃣ Prerequisiti
- ✅ Repository GitHub con il codice
- ✅ Account Netlify gratuito ([app.netlify.com](https://app.netlify.com))
- ✅ Chiave Clerk Publishable Key

### 2️⃣ Connetti Repository a Netlify

1. **Accedi a Netlify** → Clicca **"Add new site"**
2. Scegli **"Import an existing project"**
3. Seleziona **GitHub**
4. Autorizza Netlify ad accedere ai tuoi repository
5. Seleziona **`wacademy-scorm-quiz`**

### 3️⃣ Configura Build Settings

Netlify auto-rileva:
```
Build command:    npm run build
Publish directory: dist
Node version:     20
```

✅ Se tutto è corretto, clicca **"Deploy site"**

### 4️⃣ Aggiungi Variabili d'Ambiente

Durante o dopo il setup:

1. **Settings** → **Environment**
2. Clicca **"Add variable"**
3. Aggiungi:
   ```
   Nome: VITE_CLERK_PUBLISHABLE_KEY
   Valore: pk_test_Y2hhbXBpb24tdGFkcG9sZS00NC5jbGVyay5hY2NvdW50cy5kZXYk
   ```
4. **Redeploy site** per applicare le variabili

### 5️⃣ URL Pubblico

Netlify genererà un URL come:
```
https://wacademy-scorm-quiz.netlify.app
```

✅ **La tua app è live!** 🎉

---

## Auto-Deploy da Git

Ogni volta che fai un **push su `main`**:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

Netlify automaticamente:
- ✅ Trigger build
- ✅ Esegui test
- ✅ Deploy su produzione
- ✅ Genera nuovo URL se cambiato

---

## Troubleshooting

### ❌ Build fallisce con "ENOSPC"
**Soluzione**: Aumenta memory limit
```bash
# Localmente non è un problema
# Su Netlify: aumenta timeout in netlify.toml
```

### ❌ App mostra errore authentication
**Soluzione**: Verifica che `VITE_CLERK_PUBLISHABLE_KEY` sia configurata correttamente in Environment

### ❌ Gemini API key non funziona
**Soluzione**: Gemini key va incollata direttamente nell'app (browser), non in environment variables

---

## Ottimizzazioni

### Build più veloce
1. Aggiungi a `netlify.toml`:
   ```toml
   [build]
   cache = "npm"
   ```

### Configurazione custom netlify.toml

Già presente nel progetto con:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  SECRETS_SCAN_ENABLED = "false"
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Link Utili

- 📖 [Netlify Docs](https://docs.netlify.com)
- 🔧 [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview)
- 🐛 [Debugging Deploys](https://docs.netlify.com/site-deploys/overview)

---

**Deploy completato? Condividi l'URL! 🎉**
