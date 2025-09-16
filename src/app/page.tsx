import Link from "next/link";
import { DualLanguageSection } from "@/components/DualLanguageSection";
import { HouseCard } from "@/components/HouseCard";
import { getHouses } from "@/lib/data";

export default async function Home() {
  const houses = await getHouses();

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-20">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Città Futura · Programma residenziale civico
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Spazi pubblici per collaborazioni, ricerca e cultura condivisa
            </h1>
            <p className="max-w-3xl text-lg text-slate-200">
              Le residenze di Città Futura sostengono progetti che mettono al centro comunità, territori e transizione ecologica.
              Qui trovi il catalogo degli spazi e puoi inviare una richiesta di utilizzo per le tue attività.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="#catalogo"
              className="rounded-full bg-white px-6 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Esplora le case
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-slate-400 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Stato prenotazioni
            </Link>
          </div>
        </div>
      </section>

      <DualLanguageSection
        title="Città Futura"
        lead="Programma istituzionale della città per infrastrutture di prossimità e innovazione civica."
        it={
          <>
            <p>
              Città Futura coordina spazi, servizi e reti collaborative dedicate alla rigenerazione dei quartieri metropolitani.
              Le residenze sono dedicate a organizzazioni culturali, scuole, università e comunità di pratica che sviluppano
              progetti di interesse pubblico.
            </p>
            <p>
              Ogni casa è attrezzata con ambienti flessibili, tecnologie leggere e supporto curatoriale per accompagnare percorsi di
              ricerca, produzione culturale e coinvolgimento dei cittadini.
            </p>
          </>
        }
        en={
          <>
            <p>
              Città Futura coordinates spaces, services and collaborative networks dedicated to the renewal of metropolitan
              neighbourhoods. Residencies welcome cultural organisations, schools, universities and communities of practice
              committed to public interest projects.
            </p>
            <p>
              Each house offers flexible rooms, low-impact technologies and curatorial support to foster research, cultural
              production and civic participation pathways.
            </p>
          </>
        }
      />

      <DualLanguageSection
        title="Percorso di prenotazione"
        lead="Processo trasparente con valutazione pubblica delle proposte."
        it={
          <ul className="list-disc space-y-2 pl-5">
            <li>Consulta il catalogo delle case e individua l’alloggio più adatto al tuo programma.</li>
            <li>Compila il modulo di richiesta indicando date, obiettivi, esigenze tecniche e attività aperte al quartiere.</li>
            <li>Lo staff di Città Futura valuta la proposta, può contattarti per approfondimenti e comunica l’esito via email.</li>
            <li>Se la richiesta è approvata, la prenotazione viene confermata e sincronizzata con il calendario pubblico.</li>
          </ul>
        }
        en={
          <ul className="list-disc space-y-2 pl-5">
            <li>Browse the house catalogue and choose the residence that best fits your programme.</li>
            <li>Fill in the booking form describing schedule, goals, technical needs and public activities.</li>
            <li>The Città Futura team reviews the proposal, may reach you for additional details and sends a response via email.</li>
            <li>Once approved, the booking is confirmed and synchronised with the public availability calendar.</li>
          </ul>
        }
      />

      <section id="catalogo" className="mx-auto max-w-6xl space-y-8 px-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900">Catalogo delle case</h2>
          <p className="text-sm text-slate-600">
            Ogni struttura valorizza reti locali e offre servizi dedicati a progetti culturali, educativi e sociali.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {houses.map((house) => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      </section>
    </div>
  );
}
