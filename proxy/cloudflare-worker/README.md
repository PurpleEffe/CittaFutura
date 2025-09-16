# Cloudflare Worker · Prenotazioni Città Futura

Worker HTTP che riceve le richieste di prenotazione dal portale e crea automaticamente issue su GitHub con etichetta `booking`.

## Setup locale

1. Installare [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) e autenticarsi: `npm install -g wrangler` quindi `wrangler login`.
2. Duplicare `wrangler.toml` e aggiornare `name` e le variabili in `[vars]`:
   - `GITHUB_REPOSITORY`: formato `organizzazione/repo` (es. `cittafutura/citta-futura-prenotazioni`).
   - `ALLOWED_ORIGINS`: domini autorizzati a chiamare l'endpoint (GitHub Pages o ambienti di test).
   - `DEFAULT_LABELS`: etichette opzionali aggiuntive oltre a `booking`.
3. Impostare i segreti (non vanno in git):
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```
   Il token deve avere permessi `repo` e `issues:write`.

## Deploy

```bash
wrangler deploy --env production
```

L'endpoint risultante espone `POST /bookings` e restituisce `201` con `issueNumber` e `issueUrl` al successo.

## Payload accettato

```json
{
  "houseId": "casa-studio",
  "guestName": "Nome organizzazione",
  "guestEmail": "contatto@example.org",
  "guests": 4,
  "arrival": "2025-04-10",
  "departure": "2025-04-16",
  "notes": "Testo libero",
  "language": "it",
  "privacyAccepted": true
}
```

Il body dell'issue contiene il JSON sopra (con `submittedAt` e `userAgent`) racchiuso in un blocco ` ```json ` per facilitarne il parsing dal workflow GitHub Actions.
