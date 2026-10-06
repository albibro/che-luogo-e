# Dossier: geometrie e cartografia

Revisione del 4 ottobre 2026, completata prima dell’attivazione dei rispettivi canali nel progetto. Ambiti distinti: geometria statistica conservata e servita via API; tessere usate solo per visualizzazione, senza ricavarne osservazioni quantitative.

## Confini ISTAT

Fonti: [pagina ufficiale](https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/), [download 2026 generalizzato](https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip), [licenza generale ISTAT](https://www.istat.it/dati/open-data/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Copertura nazionale; geometrie comunali al 1 gennaio 2026. Scala non certificabile uniformemente, fini statistici, non catastali. Licenza con riuso commerciale, attribuzione e indicazione delle trasformazioni. Pagina aggiornata il 2 marzo 2026; acquisizione registrata nel manifesto.

Originale ZIP conservato con SHA-256. Lettura del CRS dal PRJ e verifica EPSG:32632. Trasformazione in EPSG:4326, senza semplificazione aggiuntiva, unioni o riparazioni. Centroide e punto interno calcolati in coordinate metriche e poi trasformati; il punto interno serve alla camera, non identifica il municipio. Ogni risposta conserva riferimento storico, metodo, checksum e attributi originali.

Risultato dell’acquisizione: 7.896 poligoni originali, 7.889 associati a codici attuali e validati. Castegnero Nanto è successivo alla fotografia; Rutigliano, Sannicandro di Bari, Santa Ninfa e Bronte non superano la validazione topologica. Non inventiamo sostituti. La coincidenza del codice non certifica assenza di variazioni territoriali dopo gennaio: il confine è sempre etichettato storico.

## OpenFreeMap / OSM

Fonti: [servizio e uso commerciale](https://openfreemap.org/), [istruzioni](https://openfreemap.org/quick_start/), [condizioni del servizio, aggiornate 9 settembre 2026](https://openfreemap.org/tos/), [licenze dei componenti](https://github.com/hyperknot/openfreemap/blob/main/LICENSE.md), [ODbL e attribuzione OSM](https://www.openstreetmap.org/copyright).

Il fornitore consente uso commerciale e accesso pubblico senza chiave, registrazione o quote dichiarate. Nessuno SLA, servizio revocabile. Uso normale di tessere per visualizzazione; niente raccolta massiva. Il progetto non chiama i tile server pubblici di OSM Foundation o Nominatim.

Licenze distinte: dati OSM ODbL, design OpenMapTiles CC BY 4.0, componenti e stile con licenze specifiche. Attribuzioni conservate e link ai diritti visibili. Non redistribuiamo un database derivato da OSM; le geometrie ISTAT sono uno strato indipendente. Rivedere obblighi ODbL prima di estrarre POI o derivare osservazioni.

Copertura globale, dettaglio e aggiornamento disomogenei. Affidabilità adeguata all’orientamento, non a perizie o censimenti completi. Non memorizziamo o inventiamo una data del singolo oggetto. Integrazione solo visuale: nessuna misura scientifica derivata dalle tessere.

[OpenMapTiles documenta](https://openmaptiles.org/docs/schema/) che `render_height` può essere approssimato da piani/altezze: rimuoviamo tutti i livelli `fill-extrusion` dal basemap. Nessuna altezza standard viene assegnata a edifici senza dato.

## Mapterhorn / rilievo

Fonti: [accesso HTTP alle tessere](https://mapterhorn.com/data-access/), [attribuzioni](https://mapterhorn.com/attribution/), [catalogo JSON delle fonti](https://download.mapterhorn.com/attribution.json), [note ufficiali TINITALY 1.1](https://tinitaly.pi.ingv.it/Tinitaly_1_1_AccompanyingNotes.pdf).

Il catalogo associa le fonti italiane TINITALY e regionali a CC BY 4.0 oppure CC0. TINITALY 1.1: Tarquini, Isola, Favalli, Battistini e Dotta (2023), INGV, DOI 10.13127/tinitaly/1.1. I modelli nazionali e regionali hanno risoluzioni ed epoche diverse; l’anno di accesso non è l’anno della misura. Il catalogo include anche Copernicus GLO-30 per la copertura globale. L’attribuzione estesa resta accessibile dalla mappa e dal registro.

Tessere Terrarium WebP da 512 pixel. Visualizzazione del rilievo con esagerazione pari a 1. Nessuna quota, pendenza, superficie o indicatore numerico calcolato dalle tessere. Copertura limitata nel visualizzatore a Italia e dintorni; non viene promessa una risoluzione locale uniforme. Non usiamo il DEM per stabilire la sicurezza di un immobile.

Accesso pubblico documentato; limite numerico e SLA non documentati nelle pagine esaminate, quindi non assunti illimitati. Nessun download massivo, cache server o estratto DEM conservato. Per impiego in produzione rivalutare disponibilità e versioni, oppure usare provider alternativo.

## Esito tecnico e confine delle prove

ISTAT acquisito e validato. Gli endpoint di tessere hanno risposto 403 nell’ambiente di sviluppo, senza alterare client, proxy o identità per aggirare il rifiuto. Il browser di verifica non offre WebGL utilizzabile: provata la vista statica del vero confine, non il rendering delle tessere o del terreno 3D.

L’integrazione esterna è implementata ma resta da collaudare in un browser con WebGL e accesso ai servizi. Non la dichiariamo operativa/verificata sulla base dei soli test di codice. In caso di indisponibilità resta il confine ISTAT, oppure un messaggio esplicito quando anche il confine manca. MapTiler rimane un adapter alternativo disabilitato finché non viene fornita una chiave e verificato il piano.
