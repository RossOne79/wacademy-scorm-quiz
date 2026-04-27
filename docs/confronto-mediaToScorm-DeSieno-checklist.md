# Checklist confronto con `mediaToScorm-DeSieno`

Questa checklist riassume cosa manca nel progetto corrente rispetto al repository `mediaToScorm-DeSieno`, con priorita', impatto e attivita' operative.

## Stato attuale

- Il progetto corrente ha:
  - generazione quiz con Gemini
  - autenticazione Clerk
  - packaging SCORM base
  - persistenza locale via `localStorage`
  - persistenza SCORM verso LMS (`cmi.suspend_data`, `Commit`)
- Il repository `mediaToScorm-DeSieno` aggiunge:
  - reporting remoto eventi SCORM
  - persistenza su Supabase tramite Netlify Functions
  - export CSV dei tentativi
  - modalita' multi-SCORM
  - auto-detect API SCORM 1.2 / 2004
  - metadata di tentativo piu' ricchi

## Gap principali

### 1. Reporting remoto e database

Stato: mancante nel progetto corrente

Attivita':

- [ ] Aggiungere `@supabase/supabase-js` alle dipendenze
- [ ] Aggiungere la variabile client `VITE_SCORM_REPORTING_ENDPOINT`
- [ ] Aggiungere la Netlify Function `netlify/functions/scorm-events.ts`
- [ ] Aggiungere la Netlify Function `netlify/functions/export-scorm-attempts.ts`
- [ ] Configurare in Netlify:
  - [ ] `SCORM_REPORTING_SUPABASE_URL`
  - [ ] `SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY`
- [ ] Creare in Supabase la tabella `scorm_attempts`
- [ ] Creare in Supabase la tabella `scorm_attempt_events`
- [ ] Creare la stored procedure `merge_scorm_attempt_event()`
- [ ] Verificare CORS e accesso pubblico all'endpoint `/.netlify/functions/scorm-events`

Impatto:

- sblocca il vero salvataggio su database esterno
- rende esportabili i tentativi
- abilita audit log e analytics base

Rischi:

- senza schema DB coerente, la function fallisce
- senza env vars lato Netlify, il reporting non parte
- se il pacchetto SCORM viene generato senza endpoint, funziona comunque ma non invia dati esterni

### 2. Integrazione reporting nel pacchetto SCORM

Stato: mancante nel progetto corrente

Attivita':

- [ ] Portare in `services/scormService.ts` la generazione di metadata pacchetto:
  - [ ] `packageId`
  - [ ] `packageVersion`
  - [ ] `reportingEndpoint`
- [ ] Iniettare il reporting endpoint dentro `index.html` generato
- [ ] Aggiungere invio eventi:
  - [ ] `package_loaded`
  - [ ] `session_started`
  - [ ] `attempt_started`
  - [ ] `progress_updated`
  - [ ] `quiz_completed`
  - [ ] `attempt_ended`
  - [ ] `diagnostic_ping`
- [ ] Usare `sendBeacon` su `beforeunload` per `attempt_ended`
- [ ] Aggiungere pulsante diagnostico "Test reporting" nella start page

Impatto:

- collega il pacchetto SCORM al backend esterno
- rende osservabili i tentativi reali degli utenti

Rischi:

- l'endpoint rimane incorporato nel pacchetto generato
- se l'LMS blocca richieste esterne, il reporting puo' risultare parziale

### 3. Metadati tentativo e progresso avanzato

Stato: mancante nel progetto corrente

Attivita':

- [ ] Estendere il `suspend_data` per contenere:
  - [ ] `maxWatched`
  - [ ] `videoStartTimestamp`
  - [ ] `videoEndTimestamp`
  - [ ] `attemptId`
- [ ] Aggiungere funzioni:
  - [ ] `generateAttemptId()`
  - [ ] `loadSuspendData()`
  - [ ] `persistSuspendData()`
  - [ ] `markVideoStartTimestamp()`
  - [ ] `markVideoEndTimestamp()`
- [ ] Tracciare stato tentativo:
  - [ ] `completionStatus`
  - [ ] `successStatus`
  - [ ] `rawScore`
  - [ ] `maxScore`
  - [ ] `scaledScore`
  - [ ] `passed`
- [ ] Inviare evento `progress_updated` ogni 15 secondi effettivi di avanzamento
- [ ] Calcolare e salvare `session_time` prima della chiusura del contenuto

Impatto:

- migliora tracciamento LMS
- rende il database utile per reportistica e debugging

### 4. Auto-detect SCORM 1.2 / 2004

Stato: mancante nel progetto corrente

Attivita':

- [ ] Aggiornare `types.ts` per supportare `2004 3rd Edition`
- [ ] Aggiornare `components/PackageStep.tsx` per mostrare `SCORM 2004 3rd Edition`
- [ ] In `services/scormService.ts` cercare sia:
  - [ ] `API` per SCORM 1.2
  - [ ] `API_1484_11` per SCORM 2004
- [ ] Usare dinamicamente `LMSInitialize` o `Initialize`
- [ ] Usare dinamicamente `LMSSetValue`/`SetValue`, `LMSCommit`/`Commit`, `LMSGetValue`/`GetValue`

Impatto:

- aumenta compatibilita' con LMS non perfettamente allineati al manifest

Rischi:

- va testato su LMS reali, perche' il comportamento puo' variare

### 5. Modalita' multi-SCORM

Stato: mancante nel progetto corrente

Attivita':

- [ ] Aggiornare `components/UploadStep.tsx` per supportare upload multiplo
- [ ] Aggiungere il flag `multiScorm`
- [ ] Disabilitare combinazione `multiScorm + quiz AI`
- [ ] Aggiungere callback `onMultipleVideosProcessed`
- [ ] Aggiornare `App.tsx` con:
  - [ ] `multiVideoData`
  - [ ] `isMultiScorm`
  - [ ] routing condizionale verso lo step package
- [ ] Aggiungere `components/MultiPackageStep.tsx`
- [ ] Consentire export singolo e "Esporta tutto"

Impatto:

- abilita un caso d'uso nuovo, non solo un miglioramento tecnico

Rischi:

- aumenta complessita' della UI
- va gestita bene la convivenza con autosave e restore sessione

### 6. Migliorie player/video

Stato: mancanti in parte nel progetto corrente

Attivita':

- [ ] Aggiungere fullscreen custom sul container video
- [ ] Mantenere controlli custom anche in fullscreen quando i controlli nativi sono nascosti
- [ ] Impostare `controlsList="nodownload"` sul video
- [ ] Bloccare `contextmenu` e `dragstart` sul video
- [ ] Valutare se mantenere o meno queste protezioni, sapendo che non impediscono realmente il download
- [ ] Usare naming ZIP basato sul nome file originale

Impatto:

- migliora UX
- allinea il comportamento al clone

## Cosa hai gia' in piu' del clone

Questi elementi non vanno persi durante un eventuale merge:

- [ ] mantenere la documentazione estesa in `docs/`
- [ ] mantenere le guide operative:
  - [ ] `docs/API_CONFIGURATION.md`
  - [ ] `docs/DEPLOYMENT.md`
  - [ ] `docs/SETUP_GUIDE.md`
  - [ ] `docs/USER_GUIDE.md`
- [ ] verificare che eventuali merge non rompano l'attuale UX/theme/session management

## Ordine consigliato di implementazione

### Fase 1. Backend e schema

- [ ] aggiungere dipendenza Supabase
- [ ] portare le due Netlify Functions
- [ ] creare schema Supabase
- [ ] configurare env vars Netlify

### Fase 2. Reporting nel pacchetto SCORM

- [ ] portare metadata pacchetto
- [ ] incorporare endpoint nel pacchetto
- [ ] aggiungere invio eventi e diagnostica

### Fase 3. Tracciamento avanzato

- [ ] estendere `suspend_data`
- [ ] tracciare `attemptId`, start/end timestamps, session time
- [ ] consolidare completion e score

### Fase 4. Compatibilita' SCORM

- [ ] supportare `2004 3rd Edition`
- [ ] introdurre auto-detect runtime API

### Fase 5. Funzionalita' multi-SCORM

- [ ] portare `UploadStep` multi-file
- [ ] portare `MultiPackageStep`
- [ ] adattare `App.tsx`

### Fase 6. Rifiniture e test

- [ ] verificare build locale
- [ ] testare generazione SCORM base
- [ ] testare generazione SCORM con quiz
- [ ] testare reporting con endpoint reale
- [ ] testare export CSV
- [ ] testare multi-SCORM
- [ ] testare in LMS reale almeno un contenuto 1.2 e uno 2004

## Priorita' pratica

Se vuoi massimizzare valore con il minimo rischio, l'ordine migliore e':

1. Reporting Supabase + Netlify Functions
2. Integrazione reporting in `scormService.ts`
3. Auto-detect SCORM
4. Multi-SCORM
5. Rifiniture player

## Decisioni da prendere prima di iniziare il merge

- [ ] Vuoi portare tutto il clone o solo la parte reporting/database?
- [ ] Vuoi mantenere il nome e il branding attuale del progetto?
- [ ] Vuoi usare Supabase in modo rapido con schema `public` oppure con policy/RLS piu' rigide?
- [ ] La modalita' multi-SCORM ti serve davvero ora o possiamo rimandarla per ridurre rischio?
