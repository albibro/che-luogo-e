# Esri World Imagery — verifica 5 ottobre 2026

## Fonte e composizione
Esri World Imagery è un mosaico satellitare/aereo. Maxar (indicato come Vantor in documentazione recente), Earthstar Geographics e GIS User Community sono fornitori del mosaico, non API indipendenti necessarie a questa integrazione. Non si garantisce che ogni fornitore sia presente in ogni comune.
Fonte primaria: https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
Tutorial ufficiale MapLibre: https://developers.arcgis.com/maplibre-gl-js/maps/raster-tile-basemaps/display-multiple-basemap-layers/

## Accesso e condizioni
Endpoint autenticato documentato: https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=...
Autenticazione: https://developers.arcgis.com/documentation/security-and-authentication/api-key-authentication/
Termini: https://developers.arcgis.com/maplibre-gl-js/terms-of-use/ e Master License Agreement richiamato nella scheda del servizio.
Questa integrazione richiede un account ArcGIS abilitato, chiave propria e piano/quote adeguati al proprio utilizzo. Non si assume che un endpoint pubblico non autenticato autorizzi un uso commerciale; non si riutilizzano token di esempi, né si aggira l'autenticazione.
La chiave di basemap nel frontend è pubblica: limitare i privilegi alle basemap e impostare referrer consentiti per il dominio workers.dev e l'eventuale dominio definitivo. Nessuna chiave salvata nel repository. Nessuna sottoscrizione viene attivata dal progetto.
La fonte rimane nello stato "Configurazione richiesta" finché il proprietario non configura la chiave e il servizio risponde. Uso commerciale soggetto al contratto dell'account: non segnato come open data.

## Copertura, granularità, limiti e affidabilità
Globale, Italia inclusa; dettaglio e date variabili secondo area e livello. Satellite e fotografia aerea ortorettificata, non immagini live né mesh fotorealistica 3D. Nessuna risoluzione metrica o data unica attribuita a un comune senza metadata locali.
Il DEM separato è Mapterhorn, scala altimetrica 1:1; non vengono creati edifici o altezze inventate. In assenza di DEM resta l'immagine in prospettiva, dichiarata come tale.
Livelli e tileSize letti dal metadata autenticato, senza promettere dettaglio nativo da un semplice zoom. Massimo navigazione applicativo 19, limitato anche al massimo pubblicato nel metadata.
Nessun download massivo, export offline o proxy permanente delle immagini. Nessun indicatore quantitativo estratto dal mosaico. Tariffe e limiti dipendono dall'account: consultare pannello Esri, non dichiarare gratuità o quote non verificate.

## Attribuzioni
"Powered by Esri" visibile e collegato a Esri; tutti i nomi forniti dal copyrightText corrente del MapServer. Il metadata deve contenere i crediti: senza attribuzioni non si caricano tessere. Stringhe escape HTML prima dell'inserimento nel controllo cartografico. Le attribuzioni restano visibili in fullscreen.

## Stato della verifica
Documentazione verificata. Nessuna chiave ArcGIS dell'utente disponibile: caricamento autenticato delle immagini non verificato end-to-end. Il codice fallisce esplicitamente per chiave assente, rifiutata, metadata incompatibili o crediti assenti; non sostituisce silenziosamente Esri con NASA.
