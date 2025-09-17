# Le case di Città Futura

Sito statico bilingue (IT/EN) per raccontare e gestire le case di accoglienza della comunità di Riace. Il progetto usa [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/) e [Alpine.js](https://alpinejs.dev/) per un front-end leggero, con dati salvati nel repository (`data/`) e deploy automatico su GitHub Pages.

## Requisiti

- Node.js 20+
- npm 9+

## Installazione e sviluppo locale

```bash
npm ci
npm run dev
```

Apri `http://localhost:5173` per vedere il sito in sviluppo (hot reload attivo).

Per generare la build di produzione:

```bash
npm run build
```

I file statici pronti per il deploy sono in `dist/`.

## Struttura del progetto

La cartella principale contiene i file HTML pubblici (`index`, `houses`, `book`, `admin`, `privacy`) e le risorse di supporto:

- `src/` – entry-point Vite (`main.js`), stili (`main.css`), dizionari (`i18n.js`), servizi riutilizzabili e piccoli componenti Alpine (`ui/`).
- `data/` – configurazioni di contenuto (`houses.json`) e prenotazioni (`bookings/`).
- `public/` – asset statici serviti “as-is”; la demo usa URL remoti, ma gli upload dall’admin finiscono in `houses/<slug>/`. Il file `.well-known/config.json` fornisce le impostazioni runtime (Staticman + OAuth).
- `staticman.yml` – definisce come vengono create le PR con le prenotazioni.
- `.github/workflows/` – workflow GitHub Actions per build Pages e triage delle PR.

Questa rappresentazione testuale sostituisce l’albero ASCII per ridurre i conflitti durante merge o cherry-pick da altri rami.

## Dati e immagini

- `data/houses.json` descrive ogni casa (`id`, nomi tradotti, tag, gallery). Aggiorna questo file via PR o dall’area admin.
- Nella demo le gallery puntano a foto ospitate su Unsplash per evitare file binari nella repo: quando carichi immagini reali dall’admin verranno salvate in `public/houses/<slug>/`.
- Crediti demo: Luca Bravo, Cristina Gottardi, Federico Di Dio, Jason Blackeye, Tim Graf, Shifaaz Shamoon – foto pubblicate su Unsplash (Unsplash License).
- Se aggiungi asset locali (es. loghi o foto ottimizzate) ricordati di rispettare licenze e dimensioni; aggiorna i crediti nel footer con autore e licenza.

## Configurazione Staticman

Il form pubblico (`book.html`) usa [Staticman](https://staticman.net/) per creare automaticamente una Pull Request con la prenotazione (`data/bookings/<timestamp>_<uuid>.json`).

1. Crea/aggiorna `staticman.yml` nel branch `main` (già presente).
2. Configura un’istanza di Staticman (self-hosted o pubblica) con accesso alla repo.
3. Aggiorna `/.well-known/config.json` indicando l’endpoint completo (il file vive in `public/.well-known/config.json` e viene pubblicato nella root del sito):

   ```json
   {
     "githubClientId": "YOUR_GITHUB_CLIENT_ID",
     "oauthProxyUrl": "https://your-proxy.example.com/api/exchange",
     "staticman": {
       "enabled": true,
       "endpoint": "https://api.staticman.net/v3/entry/github/<owner>/<repo>/main/bookings"
     },
     "bookingIssueFallbackUrl": "https://github.com/<owner>/<repo>/issues/new?template=booking.md"
   }
   ```

4. Il campo `bookingIssueFallbackUrl` è mostrato come canale alternativo se Staticman non risponde.

Ogni PR creata da Staticman viene etichettata automaticamente (`booking`) dal workflow `.github/workflows/staticman.yml` per facilitare la moderazione.

## GitHub OAuth per l’area Admin

`admin.html` permette ai maintainer di approvare/rifiutare prenotazioni e gestire le gallery tramite le API Contents. Per motivi di sicurezza sono necessari:

1. **GitHub OAuth App** con redirect URL `https://<org>.github.io/<repo>/admin.html`.
2. Un **proxy server** (serverless function, Cloudflare Worker, ecc.) che scambia il `code` OAuth con l’`access_token` usando il client secret. L’URL di questo servizio va inserito in `oauthProxyUrl` dentro `/.well-known/config.json`. Non committare mai il secret.
3. La pagina verifica che l’utente abbia permessi `write`/`maintain`/`admin` sulla repo prima di abilitare le azioni.
4. Il token è salvato in `sessionStorage` per la durata della sessione e può essere revocato con il pulsante “Disconnetti”.

## Flusso prenotazioni

1. L’utente compila `book.html` (senza login) → POST a Staticman.
2. Staticman apre una PR con il nuovo JSON in `data/bookings/` (`status: pending`).
3. Un maintainer revisiona e mergea la PR.
4. L’area Admin legge i file in `main` e consente di:
   - cambiare `status` (`pending`, `approved`, `rejected`, `canceled`),
   - modificare/integrare i dati,
   - cancellare la prenotazione,
   - esportare un CSV,
   - gestire le foto delle case (upload, ordina, imposta cover, elimina).

Ogni modifica usa commit dedicati via GitHub Contents API con messaggi esplicativi.

## Deploy su GitHub Pages

Il workflow `.github/workflows/pages.yml` esegue automaticamente:

1. `npm ci`
2. `npm run build`
3. Deploy dell’artefatto `dist/` su GitHub Pages (`gh-pages`).

Assicurati di abilitare “GitHub Pages → Deploy from GitHub Actions” nelle impostazioni della repo.

## Linee guida contributi

- Mantieni la palette e il tono accogliente del progetto.
- Testa localmente (`npm run build`) prima di proporre modifiche.
- Le PR con nuovi contenuti devono includere fonti e licenze delle immagini.
- Per nuovi dizionari aggiungi le chiavi in `src/i18n.js`.

## Licenza

Codice sotto licenza MIT. Le immagini incluse sono rilasciate come CC0 (sostituibili con materiali reali con le relative licenze).
