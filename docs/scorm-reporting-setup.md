# Setup SCORM Reporting con Supabase

Questa guida serve per attivare il reporting esterno degli eventi SCORM introdotto nel progetto.

## 1. Variabili ambiente

### Frontend / build del pacchetto

Nel file `.env.local` locale e nelle environment variables di Netlify aggiungi:

```env
VITE_SCORM_REPORTING_ENDPOINT=https://TUO-SITO.netlify.app/.netlify/functions/scorm-events
```

Questa variabile viene incorporata nel pacchetto SCORM al momento della generazione ZIP.

### Backend Netlify Functions

Nelle environment variables di Netlify aggiungi:

```env
SCORM_REPORTING_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY=la_tua_service_role_key
```

Note:

- `SCORM_REPORTING_SUPABASE_URL` e' l'URL del progetto Supabase.
- `SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY` e' la chiave server-side con privilegi completi.
- Non usare la `anon key` per questa integrazione server-side se vuoi un setup robusto.

## 2. Dove recuperare i valori in Supabase

Nel dashboard Supabase:

1. apri il progetto
2. vai in `Project Settings`
3. apri `API`
4. copia:
   - `Project URL` -> da usare come `SCORM_REPORTING_SUPABASE_URL`
   - `service_role` -> da usare come `SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY`

Attenzione:

- la `service_role` non va mai esposta nel client
- va messa solo nelle env vars di Netlify

## 3. Tabelle richieste

Apri `SQL Editor` in Supabase ed esegui questo script.

```sql
create table if not exists public.scorm_attempts (
  id bigint generated always as identity primary key,
  package_id text not null,
  package_title text not null,
  package_version text,
  learner_id text not null,
  learner_name text,
  attempt_id text not null,
  video_start_timestamp timestamptz,
  video_end_timestamp timestamptz,
  first_event_at timestamptz,
  last_event_at timestamptz,
  completion_status text,
  success_status text,
  raw_score numeric,
  max_score numeric,
  scaled_score numeric,
  passed boolean,
  session_time_seconds numeric,
  max_watched_seconds numeric,
  last_location text,
  suspend_data_snapshot jsonb,
  latest_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scorm_attempts_unique unique (package_id, learner_id, attempt_id)
);

create index if not exists idx_scorm_attempts_package_id
  on public.scorm_attempts (package_id);

create index if not exists idx_scorm_attempts_learner_id
  on public.scorm_attempts (learner_id);

create index if not exists idx_scorm_attempts_created_at
  on public.scorm_attempts (created_at desc);

create table if not exists public.scorm_attempt_events (
  id bigint generated always as identity primary key,
  package_id text not null,
  learner_id text not null,
  attempt_id text not null,
  event_type text not null,
  event_timestamp timestamptz not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scorm_attempt_events_lookup
  on public.scorm_attempt_events (package_id, learner_id, attempt_id);

create index if not exists idx_scorm_attempt_events_created_at
  on public.scorm_attempt_events (created_at desc);
```

## 4. RPC `merge_scorm_attempt_event`

Esegui poi questa funzione SQL:

```sql
create or replace function public.merge_scorm_attempt_event(
  p_package_id text,
  p_learner_id text,
  p_attempt_id text,
  p_event_timestamp timestamptz,
  p_video_start_timestamp timestamptz,
  p_video_end_timestamp timestamptz,
  p_completion_status text,
  p_success_status text,
  p_raw_score numeric,
  p_max_score numeric,
  p_scaled_score numeric,
  p_passed boolean,
  p_session_time_seconds numeric,
  p_max_watched_seconds numeric,
  p_last_location text,
  p_suspend_data_snapshot jsonb,
  p_latest_payload jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update public.scorm_attempts
  set
    first_event_at = coalesce(first_event_at, p_event_timestamp),
    last_event_at = coalesce(p_event_timestamp, last_event_at),
    video_start_timestamp = coalesce(p_video_start_timestamp, video_start_timestamp),
    video_end_timestamp = coalesce(p_video_end_timestamp, video_end_timestamp),
    completion_status = coalesce(p_completion_status, completion_status),
    success_status = coalesce(p_success_status, success_status),
    raw_score = coalesce(p_raw_score, raw_score),
    max_score = coalesce(p_max_score, max_score),
    scaled_score = coalesce(p_scaled_score, scaled_score),
    passed = coalesce(p_passed, passed),
    session_time_seconds = coalesce(p_session_time_seconds, session_time_seconds),
    max_watched_seconds = greatest(coalesce(max_watched_seconds, 0), coalesce(p_max_watched_seconds, 0)),
    last_location = coalesce(p_last_location, last_location),
    suspend_data_snapshot = coalesce(p_suspend_data_snapshot, suspend_data_snapshot),
    latest_payload = coalesce(p_latest_payload, latest_payload),
    updated_at = now()
  where package_id = p_package_id
    and learner_id = p_learner_id
    and attempt_id = p_attempt_id;
end;
$$;
```

## 5. RLS e sicurezza

Per partire velocemente:

- puoi lasciare queste tabelle nel schema `public`
- puoi usare la `service_role` solo lato Netlify Functions
- le funzioni scrivono server-side, quindi il client non accede direttamente a Supabase

Configurazione minima consigliata:

- attiva pure RLS se vuoi, ma non e' obbligatoria per far funzionare questo flusso
- se attivi RLS, assicurati che la `service_role` possa comunque leggere/scrivere

## 6. Verifica finale

Dopo la configurazione:

1. deploya su Netlify
2. verifica che `/.netlify/functions/scorm-events` risponda
3. genera un pacchetto SCORM con `VITE_SCORM_REPORTING_ENDPOINT` valorizzato
4. apri il pacchetto e usa il pulsante `Test reporting`
5. controlla in Supabase:
   - tabella `scorm_attempt_events`
   - tabella `scorm_attempts`
6. prova poi un tentativo completo con play video e, se presente, quiz

## 7. Eventi inviati dal pacchetto

Il pacchetto SCORM ora puo' inviare questi eventi:

- `package_loaded`
- `session_started`
- `attempt_started`
- `progress_updated`
- `quiz_completed`
- `attempt_ended`
- `diagnostic_ping`
