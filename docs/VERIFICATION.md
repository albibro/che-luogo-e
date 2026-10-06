> Stato corrente: sezione finale “Pacchetto cumulativo — 6 ottobre 2026”. Le sezioni precedenti conservano la cronologia.

# Verifiche — fase geometrie, 4–5 ottobre 2026

## Dati e API

- Archivio originale ISTAT conservato, SHA-256 verificato.
- 7.896 geometrie storiche lette; 7.889 validate e associate a codici dell’anagrafica corrente. Tre codici soppressi esclusi. Un comune nuovo senza geometria. Quattro geometrie non valide escluse, senza riparazioni automatiche.
- Test: checksum di ogni file, anelli chiusi, coordinate nel dominio geografico atteso, provenienza e riferimento temporale, endpoint geometria e gestione assenze, silhouette statica con buchi e isole.
- Restano i test di ricerca nazionale, codici univoci, lookup di tutti i comuni, dati originali, gating fonti e routing Worker.
- Nessun dato fittizio, nessuna coordinata assegnata a comuni privi di geometria valida, nessun punteggio.

Controllato che solo le geometrie validate siano negli asset pubblici; i file temporanei di generazione vengono prodotti fuori dalla cartella pubblica.

Dodici test automatici passati; TypeScript, build Vite e prerender completati. Bundle Worker verificato in dry-run, senza deploy.

## Interfaccia

Verificate scheda Carimate con il confine reale e messaggio di vista statica, ricerca di Castegnero Nanto e sua scheda con assenza di geometria esplicita. La geometria della vista SVG usa gli stessi vertici ricevuti dall’API, riproiettati per la rappresentazione sullo schermo. Sono preservati anelli interni e isole. La mappa mostra epoca storica e rimando a fonte/metodo.

La verifica GPU non è superata: WebGL non disponibile nel browser. Gli endpoint cartografici esterni sono rifiutati nell’ambiente di sviluppo (403). Non sono state alterate impostazioni o identità per aggirare il rifiuto. Terreno 3D, tessere, animazione di esplorazione e controlli MapLibre sono implementati ma non convalidati visivamente. Rimangono da collaudare prima della pubblicazione.

## Incompleto

Indicatori tematici, aggiornamento dei confini dopo gennaio, geometrie mancanti, confronto, indirizzi, database/cache remoti, GitHub, deploy e SEO comunale completo. Il progetto rimane noindex e locale. I test utente restano previsti alla fine.

## Aggiornamento 2026-10-05: globo e clima
- 17 test automatici superati; controllo TypeScript, Vite/prerender e Wrangler dry-run superati.
- Chiamata reale NASA POWER: 365 giorni 2025, originale preservato nei fixture con SHA e URL. Test serie incomplete, null, fill -999, unità e periodo errati: nessun numero sostitutivo.
- GIBS capabilities e tessera Blue Marble HTTP 200; matrice e template estratti dal capabilities, niente immagini generate.
- Browser remoto: accesso localhost bloccato; verifica visuale del globo, terreno e MapTiler non completata. Non presentare il 3D come collaudato.

- Endpoint completo handleApi → provider NASA via rete verificato: HTTP 200 per Carimate, cella 9,375 E / 45,5 N; media 14,199506849315062 °C, 23 giorni Tmax >30 °C, 1237,8699999999988 mm. I valori in UI sono arrotondati, gli originali restano invariati.

## Revisione Esri e navigazione continua — 5 ottobre 2026
- 20 test superati: nessuna chiamata Esri senza chiave; rifiuto dei metadata privi di crediti; escaping dei crediti; livelli e risoluzioni da metadata reale; azioni camera senza cambio stile e senza limite 8.
- Fixture Esri: https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson , sola lettura dei metadata pubblici; non prova di diritto all'uso anonimo delle tessere. Crediti correnti Esri/Vantor/Earthstar/GIS User Community.
- Endpoint operativo diverso e autenticato: ibasemaps-api.arcgis.com, come tutorial ufficiale. Nessuna chiave presente, quindi test di accesso autenticato non eseguito. Nessuna immagine dimostrativa o key pubblica altrui usata per fingere il test.
- Vite locale avviato in PTY, ma non raggiungibile da una seconda sessione nell'ambiente; verifica UI WebGL bloccata. Test di camera verificano la regressione logica; non equivalgono a un collaudo visuale del sito online.


## Aggiornamento API — 5 ottobre 2026

- 29 test superati: inclusi originali e checksum, epoche ISPRA, sentinelle -1/null, codici errati, registro farmacie nazionale e filtro storico, riquadro/CC0 GBIF, blocco aria senza chiave, cache/deduplicazione, endpoint e isolamento degli errori, schede con fonte corretta. I test negativi modificano copie in memoria di risposte reali; nessuna fixture viene utilizzata nel prodotto.
- Build TypeScript/Vite e prerender riusciti. Dry-run Wrangler riuscito: 8.661,48 KiB prima della compressione, 1.539 KiB gzip; 8.017 asset. Nessuna pubblicazione eseguita.
- Chiamate reali ISPRA: Carimate, Roma, Palermo. Registro ministeriale: conteggi verificati negli stessi comuni. Chiamata GBIF con bbox ISTAT reale: Carimate. Risposte Carimate e metadati di acquisizione in tests/fixtures. Non è un collaudo upstream di ogni comune italiano.
- Aria: testato il blocco senza chiave; chiamata commerciale non verificata, nessuna credenziale disponibile. Rendering visivo nel browser e test del sito Cloudflare pubblicato non eseguiti in questa fase.
- Copertura farmacie: 6.731 comuni calcolabili, 1.162 senza record associato, 1 con record non validabile; assenza mai convertita in zero. Snapshot aggiornabile con importatore incluso.


## Pacchetto cumulativo — 6 ottobre 2026

- 36 test automatici superati. Aggiunti controlli su originali delle quattro nuove fonti, SHA-256 di tutte le partizioni, conteggi di copertura, celle MEF oscurate, denominatori e divisione per zero, variazione netta negativa reale ISPRA, registri scolastici/settori/autonomie, percentuali AGCOM, codici errati, archivio alterato e stati del catalogo.
- Quattro endpoint aggiuntivi verificati su Carimate, Roma e Palermo con i dati scaricati dai portali ufficiali; test negativi su copie in memoria, mai usate nell’app. Comune nuovo senza corrispondenza restituisce null, non valori dei comuni precedenti.
- TypeScript, build Vite e prerender riusciti. Wrangler dry-run riuscito: 8.718,58 KiB non compressi / 1.563,15 KiB gzip; 8.454 asset. Nessuna pubblicazione.
- Logo AGCOM verificato visivamente dall’immagine ufficiale e presente nell’interfaccia. Rendering completo dell’interfaccia, GPU/WebGL e credenziali Esri/CAMS non collaudati in questa fase. I test di rendering delle schede sono controlli HTML lato server, non simulazioni di browser.
- Nessun mock di prodotto e nessuna chiamata commerciale effettuata. Per ogni archivio restano data, URL originale, checksum e limiti geografici.


## Dashboard e confronto — 6 ottobre 2026

43 test automatici superati. Nuovi casi: differenza B−A da record MEF reali, zero senza divisione, blocco per metadati incompatibili o assenti, confronto di previsioni per istante, riconoscimento stessa cella, GBIF escluso, componenti dashboard/confronto e rotta diretta. Build e prerender comprendono `/confronta`.

Anteprima browser locale bloccata con `ERR_BLOCKED_BY_CLIENT`; collaudo visivo e interattivo non eseguito. Nessun deploy. Guida e metodologia in `DASHBOARD-CONFRONTO.md`.
