# Città Futura · Prenotazioni

Portale istituzionale per presentare il catalogo delle case di Città Futura, raccogliere richieste di utilizzo e pubblicare lo stato delle prenotazioni. Il progetto comprende:

- Sito Next.js 14 (TypeScript + Tailwind) con contenuti bilingue (IT/EN) e pagine statiche per GitHub Pages.
- Modulo di richiesta che invia i dati a un Worker Cloudflare incaricato di creare issue `booking` nel repository.
- Workflow GitHub Actions `sync-bookings.yml` che sincronizza i file JSON (mirror delle prenotazioni) e genera i calendari ICS pubblici.

## Requisiti

- Node.js >= 20
- npm 10+
- Account Cloudflare per il deploy del Worker
- Repository GitHub con Pages attivo

## Configurazione locale

```bash
npm install
npm run dev
```

La build statica si ottiene con:

```bash
npm run build
```

I file esportati si trovano in `./out`.

## Configurazione GitHub Pages

1. In **Settings → Pages** impostare _Build and deployment_ su **GitHub Actions**.
2. Il workflow `.github/workflows/deploy.yml` si occupa di lint, build e deploy automatico su push verso `main`.
3. Se il sito viene pubblicato in una sotto-cartella (`https://<org>.github.io/<repo>`), impostare la variabile `NEXT_PUBLIC_BASE_PATH` sia nei secrets del repo sia localmente (`.env.local`) con valore `/<repo>`. Il `next.config.ts` userà questo prefisso per asset e link.

## Token GitHub e segreti

Il Worker necessita di un token con permessi `repo` e `issues:write` per creare le issue.

1. Creare un **Fine-grained personal access token** da <https://github.com/settings/tokens?type=beta> limitato al repository e con permessi `Issues: Read and write`.
2. Salvare il token come segreto di progetto Cloudflare tramite `wrangler secret put GITHUB_TOKEN`.
3. Per il workflow `sync-bookings.yml` non servono segreti aggiuntivi: usa il `GITHUB_TOKEN` fornito automaticamente da GitHub Actions.

## Deploy del Worker Cloudflare

1. Installare Wrangler (`npm install -g wrangler`) e autenticarsi (`wrangler login`).
2. Nella cartella `proxy/cloudflare-worker/` aggiornare `wrangler.toml` con:
   - `name`: nome univoco del servizio Worker
   - `GITHUB_REPOSITORY`: `organizzazione/repo`
   - `ALLOWED_ORIGINS`: dominio GitHub Pages o ambienti autorizzati
   - `DEFAULT_LABELS`: eventuali etichette extra (es. `prenotazione`)
3. Impostare i segreti:
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```
4. Pubblicare: `wrangler deploy`. Il Worker espone `POST /bookings` e restituisce `201` con `{ issueNumber, issueUrl }`.
5. Copiare l'URL restituito da Cloudflare e impostarlo come variabile `NEXT_PUBLIC_BOOKING_ENDPOINT` (secret nel repo o variabile Pages) per abilitarne l'uso nel form.

## Variabili d'ambiente principali

| Variabile | Dove | Descrizione |
|-----------|------|-------------|
| `NEXT_PUBLIC_BOOKING_ENDPOINT` | Next.js / Pages | URL del Worker Cloudflare `POST /bookings` |
| `NEXT_PUBLIC_BASE_PATH` | Next.js / Pages | Prefisso per asset e link su GitHub Pages (es. `/citta-futura-prenotazioni`) |
| `GITHUB_REPOSITORY` | Worker | Repository target in formato `org/repo` |
| `GITHUB_TOKEN` | Worker (segreto) | PAT con permessi issues |
| `ALLOWED_ORIGINS` | Worker | Lista di origini autorizzate (se vuota accetta tutti) |
| `DEFAULT_LABELS` | Worker | Etichette opzionali per le issue generate |

## Struttura dei dati

- `data/houses.json`: catalogo delle case (contenuto seed usato durante la build).
- `data/bookings/<houseId>.json`: mirror delle prenotazioni, aggiornato dal workflow su ogni issue con label `booking`.
- `public/data/bookings/<houseId>.json`: copia pubblica per la pagina `/admin`.
- `public/ics/<houseId>.ics`: calendario ICS delle prenotazioni confermate.

## Workflow `sync-bookings`

1. Un'issue riceve l'etichetta `booking` (creata dal Worker o manualmente).
2. L'azione legge il JSON contenuto nel body dell'issue e aggiorna il file `data/bookings/<houseId>.json` (crea o aggiorna la prenotazione).
3. I file pubblici vengono allineati e il calendario ICS viene rigenerato con gli eventi **confermati** (issue chiusa con motivo `completed`).
4. Il workflow committa le modifiche su `main`, innescando il deploy Pages.

### Stati gestiti

- **pending**: issue aperta → visualizzata come "in valutazione" e calendario in giallo.
- **confirmed**: issue chiusa con `state_reason=completed` → inserita nell'ICS.
- **cancelled**: issue chiusa con `state_reason=not_planned` → visibile solo nello storico.

## Flusso operativo

1. **Utente** compila il modulo sul portale → invio al Worker Cloudflare.
2. **Worker** crea l'issue nel repository con label `booking` e body JSON.
3. **Workflow `sync-bookings`** allinea i file JSON/ICS e committa su `main`.
4. **Gestore** valuta l'issue su GitHub (commenta, modifica date, chiude con esito). La chiusura aggiorna automaticamente il calendario.
5. **Portale** mostra il nuovo stato nella pagina della casa e in `/admin` dopo il deploy Pages successivo.

## Comandi utili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia sviluppo locale |
| `npm run lint` | Verifica linting con ESLint |
| `npm run build` | Compila la versione statica (produce `out/`) |

## Contenuti

I testi italiani e inglesi sono ispirati ai materiali informativi ufficiali di Città Futura, con tono istituzionale e descrizione dei servizi civici, senza claim commerciali.
