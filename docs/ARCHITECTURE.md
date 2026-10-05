# Architettura — fase anagrafica nazionale

## Filiera attiva

API ISTAT SITUAS → snapshot originale verificato → provider nazionale nel Worker → API applicativa → provider HTTP → React.

Il file originale e il manifesto restano lato server. La UI riceve risultati limitati e la scheda selezionata. L’importatore valida campi, codici univoci e copertura regionale, controlla variazioni anomale del numero di comuni e calcola SHA-256. Non interroga ISTAT per ogni ricerca. Gli aggiornamenti sono manuali, con revisione del diff e test prima del rilascio.

`DataProvider` espone ricerca, scheda, fonti e stato come funzioni asincrone. Gli errori non attivano fallback a dati simulati. Fonti approvate e candidate sono separate nel registro. Prima di collegare un nuovo provider è necessario il dossier, oltre al controllo automatico di licenza e stato.

## Contratti e API

- `GET /api/v1/municipalities?q=`: minimo due caratteri, massimo cento, fino a venti risultati; nome, codici, regione e provincia ricercabili. Nessun risultato inventato.
- `GET /api/v1/municipalities/:slug`: identificativo con codice ISTAT. Include `original`, `provenance`, osservazioni e valutazioni (attualmente liste vuote).
- `GET /api/v1/sources`: registro fonte attiva e candidate.
- `GET /api/v1/municipalities/:slug/geometry`: geometria GeoJSON con provenienza; 404 se manca, 503 se lo storage non è accessibile.
- `GET /api/v1/status`: manifesto del dataset con conteggio, riferimento e acquisizione.

Risposte 400 per ricerca troppo lunga, 404 per assenze, 405 per metodi non supportati, 503 per configurazione non disponibile. Niente cache remota finché non configurata; `no-store` sulle risposte attuali.

## Modello e persistenza

Comune: codice amministrativo, nome, regione, unità sovracomunale; coordinate derivate dai confini storici quando validi, altrimenti null. Slug derivato dal nome e dal codice. Fonte: editore, URL, stato della verifica, licenza, data, copertura, granularità e limiti. Osservazione: originale e normalizzato, periodo, acquisizione/aggiornamento, risoluzione, affidabilità motivata, metodo e lineage. Valutazione: tabella separata con metodo versionato e input. Nessun voto complessivo.

Il modello non ammette dati mock. La migrazione SQL iniziale è stata aggiornata prima di qualsiasi applicazione a database; non è stata applicata a Cloudflare. Prima di previsioni reali aggiungere campi espliciti per modello, scenario, orizzonte e incertezza. I tipi attuali non costituiscono un’implementazione delle previsioni.

D1 conterrà anagrafiche e osservazioni; KV cache versionate entro i limiti di licenza; R2 payload/geometrie grandi se necessario. Nessun binding o servizio remoto creato. La persistenza attuale è il file versionato, non un database già in esercizio.

## Cartografia

Geometrie storiche ISTAT conservate come asset per singolo comune; Worker legge soltanto il file richiesto tramite ASSETS e lo restituisce via API con provenienza. Nessun caricamento dell’Italia intera nel bundle frontend. Indice con centroidi, punto interno, bbox e checksum lato server. Originale ZIP conservato nel progetto, escluso dagli asset pubblici.

MapLibre con adapter OpenFreeMap/Mapterhorn predefinito, MapTiler alternativo. I servizi esterni hanno condizioni e attribuzioni separate. Il rendering carica uno stile locale del solo confine, quindi tenta lo sfondo esterno e il DEM. Errori esterni non inventano uno sfondo o rilievo. Se manca WebGL, SVG del poligono reale; se manca il poligono, messaggio esplicito. Nessuna estrusione da altezze predefinite.

L’integrazione 3D non è ancora convalidata visivamente per i limiti dell’ambiente. Dossier completo e condizioni in SOURCE_GEOGRAPHY.md. Nessuna cache persistente o estrazione dalle tessere. Non vengono create osservazioni numeriche cartografiche a partire dai pixel.

## Routing e indicizzazione

Vite dev usa lo stesso handler API del Worker. Build: homepage, metodologia, shell comunale e 404 prerenderizzate. Worker verifica l’esistenza del comune, reindirizza alias univoci allo slug canonico e serve la shell per i link diretti. Conserva 404 per comuni inesistenti. Le schede ricevono il record via API nel browser; SSR dei contenuti, metadati specifici, sitemap e canonicals sono un’attività successiva. `noindex` rimane intenzionalmente attivo.

Stack e hosting restano quelli scelti: React/TypeScript/Vite, MapLibre, Cloudflare Worker/D1/KV/R2, GitHub. Solo Git locale inizializzato; non è stato fatto alcun deploy.
