# Pacchetto cumulativo — 6 ottobre 2026

Questo ZIP contiene il progetto intero aggiornato. Non serve applicare separatamente gli aggiornamenti precedenti. Il nome del file conserva “fase-1” per continuità, ma il contenuto è cumulativo.

## Novità dashboard e confronto

Dashboard tematica con indicatori principali, barre percentuali, composizione per età e letture contestuali dei dati. Mappa 3D e fonti espandibili. Nel menu è attivo **Confronta**: seleziona due comuni, apri una categoria e condividi il link. Dalla dashboard puoi precompilare il primo comune. Differenze soltanto fra dati compatibili; nessun voto complessivo. Guida: `docs/DASHBOARD-CONFRONTO.md`.

## Fonti già incluse

- Redditi dichiarati MEF: contribuenti e medie fiscali 2024, con denominatori originali.
- Scuole MIM: statali e paritarie 2026/27; elenco di nomi, tipologie e indirizzi.
- Consumo di suolo ISPRA: quota, ettari, variazione netta e ripristino.
- Fibra FTTH AGCOM: copertura e famiglie raggiunte stimate, riferimento giugno 2026.
- Altri campi ISPRA: superficie, famiglie, fascia 15–64 anni, unità locali delle imprese, patrimonio culturale e scenari alluvionali.
- Catalogo esteso a 12 categorie e 58 indicatori, comprese Case, Sicurezza, Redditi, Scuole e Connettività.

Sono 35 gli indicatori collegati senza nuove chiavi, più 4 previsioni aria che richiedono una chiave commerciale. I restanti 19 sono esplicitamente da integrare. Il numero disponibile varia per comune: nessun valore mancante viene inventato.

I dati aggiunti sono copie di archivi ufficiali consultabili tramite l’API dell’app: non si aggiornano automaticamente. Fonte, data, granularità, affidabilità e metodo accompagnano ogni osservazione.

## Un solo aggiornamento, quando vuoi pubblicarlo

1. Estrai lo ZIP e apri la cartella interna `che-luogo-e`.
2. In GitHub Desktop seleziona il repository del sito e scegli **Repository → Show in Explorer** oppure **Show in Finder**.
3. Copia il contenuto della cartella estratta nella cartella del repository. Sostituisci i file omonimi e includi tutte le sottocartelle, in particolare `public/data`, `server`, `worker` e `src`. Non creare una seconda cartella `che-luogo-e` dentro il repository.
4. In GitHub Desktop, nel campo **Summary**, scrivi `Aggiornamento cumulativo API e categorie`. Premi **Commit to main**, poi **Push origin**. Conserva le tue chiavi locali: non caricarle su GitHub.
5. La build Cloudflare deve partire dalla cartella che contiene `package.json` e `wrangler.jsonc`. Comando build: `npm run build`. Comando deploy: `npx wrangler deploy`. Per includere i test nella build puoi usare `npm run check`.
6. Dopo il deployment riuscito, ricarica completamente il sito. Controlla le categorie di Carimate, Roma e Palermo, aprendo “Dato, fonte e metodo”.

Per le nuove fonti di questo pacchetto non devi acquistare servizi, incollare chiavi o creare D1, KV e R2. Le istruzioni separate per satellite Esri e aria CAMS restano in `docs/ATTIVARE-SATELLITE-ESRI.md` e `docs/AGGIORNAMENTO-API.md`.

## Cosa non è ancora completo

Prezzi delle case, sicurezza, 5G, trasporti, alberi, aree protette, altre voci sanitarie, demografia aggiornata e sismica hanno schede previste ma non dati collegati. Non basta una chiave per attivare queste sezioni: servono ulteriori integrazioni.

Satellite Esri e previsioni aria richiedono credenziali proprie. Il rendering 3D nel browser non è stato collaudato in questo ambiente. Il confronto è implementato. Restano da completare ricerca per indirizzo e indicizzazione delle schede. Il progetto rimane in costruzione e `noindex`.

Verificati: 43 test automatici, build TypeScript/Vite e preparazione del bundle Cloudflare senza pubblicazione. Non è stato eseguito un deploy nel tuo account.

Documentazione tecnica e limiti: `docs/SOURCE_CONTEXT_APIS.md`, `docs/VERIFICATION.md`, `docs/API_ROADMAP.md`.
