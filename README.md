# Città Futura – Prenotazioni

Piattaforma locale per gestire le richieste di soggiorno nelle case della rete di accoglienza di Città Futura (Riace). Il progetto include un backend Fastify + Prisma con database SQLite e un frontend React/Tailwind basato su Vite. Tutto gira in locale senza dipendenze da servizi esterni.

## Caratteristiche principali

- **Autenticazione email/password** con cookie HTTP-only e JWT.
- **Ruoli**: utenti, gestori e admin con permessi dedicati.
- **Gestione case**: creazione, modifica, cancellazione e filtri per capienza/servizi.
- **Prenotazioni**: invio richieste, approvazione/rifiuto, blocco automatico delle sovrapposizioni.
- **Calendario**: vista read-only con prenotazioni approvate e periodi di blackout.
- **Seed pronto all’uso** con utenti demo e tre case di esempio.

## Prerequisiti

- [Node.js](https://nodejs.org/) >= 20 (include npm)

## Primo avvio

```bash
git clone https://github.com/PurpleEffe/CittaFutura.git
cd CittaFutura
npm ci
npm run db:reset
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:4000>

Credenziali demo generate dal seed (`npm run db:reset`):

- **Admin** — `admin@demo.local` / `admin123!`
- **Gestore** — `gestore@demo.local` / `gestore123!`
- **Utente** — `utente@demo.local` / `utente123!`

## Script disponibili

| Comando             | Descrizione                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `npm run dev`       | Avvia API (Fastify+Prisma) e frontend Vite in parallelo.                     |
| `npm run build`     | Compila backend (TypeScript → dist) e build del frontend (Vite).             |
| `npm start`         | Avvia il backend in produzione locale servendo anche la build del frontend. |
| `npm run db:reset`  | Rigenera il database SQLite, applica le migrazioni e lancia il seed.         |
| `npm run db:migrate`| Applica le migrazioni Prisma sul database indicato in `.env`.                |
| `npm run lint`      | Esegue ESLint su tutto il monorepo.                                          |

## Struttura del repository

```
apps/
  api/       -> Backend Fastify + Prisma
  web/       -> Frontend React + Vite + Tailwind
prisma/      -> Schema e migrazioni Prisma
scripts/     -> Seed iniziale dell’applicazione
```

## Note di sviluppo

- Il database SQLite si trova in `data/app.db`. Il percorso è configurato nel file `.env` alla radice.
- In produzione locale (`npm run build && npm start`) il backend serve la build statica del frontend.
- Tutte le chiamate fetch dal frontend usano `credentials: 'include'` per supportare i cookie HTTP-only.
- ESLint/Prettier assicurano formattazione coerente su frontend e backend.

## Licenza

Questo progetto è rilasciato sotto licenza MIT.
