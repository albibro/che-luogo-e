# Che luogo è? — Pacchetto cumulativo API

**Aggiornamento 6 ottobre 2026:** leggere `LEGGIMI-AGGIORNAMENTO.md` per contenuti, limiti e un solo aggiornamento GitHub/Cloudflare. 12 categorie, 58 indicatori previsti; 35 collegati senza nuove credenziali, 4 previsioni aria subordinate alla chiave, 19 ancora da integrare. La disponibilità varia per comune.

Progetto locale React, TypeScript, Vite e Cloudflare Workers. **Nessun dato o geometria inventati.** Sono integrate l’anagrafica ufficiale ISTAT SITUAS e le geometrie statistiche comunali ISTAT. Sono integrati indicatori climatici NASA POWER, rischi ISPRA, demografia ISTAT 2021 via ISPRA, farmacie ministeriali, segnalazioni GBIF CC0, redditi MEF 2024, scuole MIM 2026/27, consumo di suolo ISPRA e fibra FTTH AGCOM. Collegamento CAMS/Open-Meteo predisposto con chiave commerciale. Nessun punteggio. I dati di epoche diverse hanno date e limiti espliciti.

## Dashboard e confronto

Schede comunali riorganizzate in pannelli tematici, indicatori principali, visualizzazioni percentuali e letture contestuali. Dati originali e metodo espandibili. `/confronta` permette di selezionare due comuni, filtrare le categorie, vedere differenze compatibili, scambiare A/B e copiare un link. Dettaglio: `docs/DASHBOARD-CONFRONTO.md`. Nessun punteggio complessivo.

## Avvio

Node.js 22.12+ e npm:

```sh
npm ci
npm run dev
```

Aprire localhost:4173. Ricerca nazionale per nome, provincia/regione o codice ISTAT. La UI chiama `/api/v1`; il server Vite usa lo stesso handler del Worker.

```sh
npm run check         # test, TypeScript, build, prerender
npm run worker:check  # bundle Cloudflare, senza pubblicare
npm run worker:dev    # API e asset locali dopo la build
python3 scripts/update-istat.py 2026-10-04
```

`npm run preview` serve soltanto asset statici e non le API: per verificare la versione costruita usare `worker:dev`.

## Dati reali

Snapshot acquisito il 4 ottobre 2026 dall’API ufficiale SITUAS: 7.894 comuni, 20 regioni. Licenza CC BY 4.0, attribuzione ISTAT. Download originale conservato in `server/data/istat-comuni.raw.json`; data di riferimento, acquisizione, metodo e SHA-256 in `istat-manifest.json`. Ogni scheda espone il record originale e la provenienza. Ultimo aggiornamento del singolo record non fornito dalla fonte.

La ricerca serve questa fotografia dell’anagrafica, non richieste upstream in tempo reale. L’importazione è manuale e riproducibile; nessuna schedulazione remota è attiva. Il dataset resta nel Worker, non nel bundle browser. Gli slug includono il codice ISTAT; nomi ambigui senza codice non vengono risolti arbitrariamente.

## Geometrie e mappa 3D

7.889 confini statistici reali al 1 gennaio 2026, da archivio ISTAT CC BY 4.0. Originale ZIP conservato in `data/original`, geometrie trasformate in `public/geodata`, indice e manifesto lato server. La UI richiede `GET /api/v1/municipalities/:slug/geometry`. Centroidi e punti di centraggio sono elaborazioni geometriche documentate, non posizioni del municipio.

Cinque comuni senza geometria validata: Castegnero Nanto (nuovo codice), Rutigliano, Sannicandro di Bari, Santa Ninfa e Bronte (geometrie topologicamente non valide). Nessun sostituto inventato. I confini possono essere diversi dal territorio attuale anche per codici invariati; data storica sempre visibile.

MapLibre: globo continuo, satellite Esri World Imagery con chiave propria, volo al comune, zoom senza il precedente limite 8, confine attivabile, vista 2D/3D, giro di esplorazione manualmente avviabile, rispetto di reduced-motion, schermo intero. Sfondo OpenFreeMap e rilievo Mapterhorn senza chiave; Esri richiede VITE_ESRI_API_KEY, attribuzioni caricate dal servizio. MapTiler resta opzionale con chiave e piano verificato. `VITE_MAP_PROVIDER=disabled` disattiva i servizi esterni. Attribuzioni e limiti nella UI. Nessuna estrusione di edifici da altezze stimate/default.

**Verifica limitata:** capabilities e tessera GIBS NASA verificati HTTP 200, API climatica completa verificata con risposta reale; rendering browser del globo non convalidato (accesso locale bloccato nell’ambiente). La vista statica del confine reale era stata verificata nella versione precedente; il rendering 3D esterno resta da verificare. Non è una mappa fotorealistica o una prova di copertura degli edifici.

Riproduzione delle geometrie (Python 3.12):

```sh
python3 -m venv .geo-venv
.geo-venv/bin/pip install -r scripts/geo-requirements.txt
.geo-venv/bin/python scripts/import-boundaries.py
```

Il file ZIP originale è incluso. Script senza riparazioni automatiche, con verifica del CRS, della geometria e del rapporto con l’anagrafica corrente. L’aggiornamento dell’epoca dei confini richiede un nuovo dossier e una revisione dello script.

## Stato e prossime fasi

- Funzionanti: ricerca nazionale API, schede anagrafiche, provenienza, filtri indicatori, registro delle fonti candidate e metodologia.
- Collegati: ISPRA (frane/alluvioni e censimento 2021), farmacie dal JSON ministeriale del 5 ottobre 2026 tramite nostra API, GBIF CC0 nel bbox comunale.
- Da attivare con chiave commerciale: previsioni orarie aria CAMS/Open-Meteo.
- Da integrare: demografia aggiornata, medie annue aria, trasporti, copertura arborea, aree protette, immobili, sicurezza, reti mobili e altre soglie di connettività. Ogni dossier precede l’integrazione.
- Da completare: collaudo del rendering 3D, indirizzi, collaudo interattivo confronto, caching KV, importazione D1, R2 se necessario, pagine comunali prerenderizzate/SSR per indicizzazione, sitemap e dominio canonico.
- La precedente versione è stata pubblicata dall’utente su GitHub/Cloudflare. Questo aggiornamento deve ancora essere caricato nel suo repository. Nessun login, pagamento, recensione o social.

L’HTML generale è prerenderizzato; le schede caricano i dati via API. Il progetto resta `noindex` durante lo sviluppo. Non è ancora un MVP completo.

Documentazione: `docs/ARCHITECTURE.md`, `docs/SOURCE_ISTAT.md`, `docs/API_ROADMAP.md`, `docs/SOURCE_GEOGRAPHY.md`, `docs/VERIFICATION.md`.

## Aggiornare il sito
Seguire `docs/ATTIVARE-SATELLITE-ESRI.md`. NASA POWER resta senza chiave. Il satellite Esri richiede una chiave propria e condizioni dell’account verificate. La sostituzione NASA è stata rimossa. In assenza di chiave la mappa OpenStreetMap resta navigabile; la UI indica Satellite da attivare.

## API climatica
`GET /api/v1/municipalities/:slug/climate`: tre aggregazioni annue 2025 da NASA POWER/MERRA-2. Griglia 0,5° × 0,625°, cella dal punto interno ISTAT. Non media del comune, non climatologia pluridecennale. Nessun dato per geometrie mancanti; errori upstream espliciti (503), con riprova nella UI. Originale JSON esatto, SHA256, timestamp, serie e metodi esposti. Cache Workers per cella/anno (7 giorni) e richieste simultanee accorpate per istanza. Nessuna risorsa D1/KV/R2 aggiuntiva richiesta. Per traffico elevato servono cache globale persistente e limitazione upstream. Revisione fonte in `docs/SOURCE_NASA.md`.

## Revisione navigazione Esri
20 test superati, build valida. Documentazione Esri e metadata reali verificati; raster autenticato non collaudato senza chiave. Vista ampia, camera persistente, resize observer per fullscreen, zoom/pinch espliciti, errori delle tessere non oscurano il canvas. Vedi `docs/SOURCE_ESRI.md`.

## Nuove API territoriali

Per aggiornare il sito: `LEGGIMI-AGGIORNAMENTO.md`. Dossier fonti: `docs/SOURCE_CONTEXT_APIS.md` e `docs/SOURCE_ADDITIONAL_APIS.md`.

`GET /api/v1/municipalities/:slug/indicators/territory|services|nature|air|income|soil|schools|broadband` restituisce un bundle con stato, messaggio, osservazioni e originale. Gli otto endpoint falliscono indipendentemente, con errore 503 per risposte non disponibili o non validabili; il blocco per chiave mancante è uno stato esplicito del bundle. I provider si sostituiscono tramite `server/indicators.ts`. Nessun dataset di test viene importato in produzione.

43 test automatici superati, build e verifica bundle Worker riuscite. ISPRA e farmacie verificati su Carimate, Roma, Palermo; GBIF su Carimate. Per il dettaglio e i limiti della verifica vedere `docs/VERIFICATION.md`.
