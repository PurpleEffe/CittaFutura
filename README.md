# Città Futura – Prenotazioni

Piattaforma locale per coordinare le richieste di soggiorno nelle case della rete di accoglienza di Città Futura (Riace). Il progetto adotta un approccio **local-first**: tutto gira in locale senza servizi esterni, con database SQLite rigenerabile tramite seed e interfaccia moderna basata su **Tailwind CSS + daisyUI**.

## Contenuto del repository

```
apps/
  api/   → Backend Fastify + Prisma
  web/   → Frontend React + Vite + Tailwind + daisyUI
prisma/  → Schema e migrazioni Prisma
scripts/ → Seed e utility
data/      → Conterrà il database SQLite generato tramite `npm run db:reset`
```

## Requisiti

- Node.js ≥ 20 (include npm)

## Avvio immediato

```bash
git clone https://github.com/PurpleEffe/CittaFutura.git
cd CittaFutura
npm ci
npm run db:reset
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:4000>

Il comando `npm run db:reset` genera `data/app.db` applicando le migrazioni e popolando dati demo:

| Ruolo   | Email                   | Password    |
| ------- | ----------------------- | ----------- |
| Admin   | `admin@demo.local`      | `admin123!` |
| Gestore | `gestore@demo.local`    | `gestore123!` |
| Utente  | `utente@demo.local`     | `utente123!` |

## Script disponibili

| Comando             | Descrizione                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `npm run dev`       | Avvia API e frontend in parallelo con hot-reload.                            |
| `npm run build`     | Compila backend (`tsc`) e frontend (`vite build`).                           |
| `npm start`         | Avvia il backend in modalità produzione locale servendo anche la build web. |
| `npm run db:reset`  | Rigenera il database SQLite, applica le migrazioni e lancia il seed.         |
| `npm run db:migrate`| Applica le migrazioni Prisma sul database configurato in `.env`.             |
| `npm run lint`      | Esegue ESLint su tutto il monorepo.                                          |

## Esperienza utente

- **UI professionale** con daisyUI (tema `corporate`), navbar sticky e layout responsive.
- **Calendario disponibilità** con evidenza di prenotazioni approvate e periodi di blackout.
- **Form e tabelle accessibili** con badge di stato, drawer mobile per la gestione case, modali di conferma e toast di feedback.
- **Autenticazione** email/password con cookie httpOnly e JWT.
- **Gestione ruoli** (utente, gestore, admin) per filtri e azioni dedicate.

## Flussi principali

1. **Richiesta soggiorno**: l’utente sceglie una casa, compila il form e vede lo stato nell’area personale.
2. **Gestione prenotazioni**: il gestore approva o rifiuta dal pannello dedicato, con blocco automatico delle sovrapposizioni.
3. **Gestione case**: creazione, modifica ed eliminazione direttamente dal drawer laterale (responsive).
4. **Calendario**: la pagina dettaglio casa mostra, in griglia read-only, le date occupate o bloccate.

## Personalizzazione

- Il file `.env` contiene le variabili predefinite (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
- Le configurazioni Tailwind/daisyUI sono in `apps/web/tailwind.config.ts`.
- Il seed (`scripts/seed.ts`) permette di rigenerare il database con gli stessi dati demo (`npm run db:reset`).

## Licenza

MIT License.
