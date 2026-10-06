# NASA POWER e GIBS — verifica 5 ottobre 2026

## POWER, prima integrazione tematica
Fonte: NASA Langley POWER Daily API; meteorologia MERRA-2, rianalisi (modello con assimilazione di osservazioni), NON centralina e NON previsione.
Endpoint: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
Metodo e risoluzione: https://power.larc.nasa.gov/docs/methodology/meteorology/
Uso commerciale: risposta del team NASA in https://forum.earthdata.nasa.gov/viewtopic.php?t=82 autorizza ricerca, pubblicazioni e applicazioni commerciali con riconoscimento della fonte. Dati aperti NASA, non assegnare una licenza CC inventata. Attribuzione: NASA POWER / NASA Langley Research Center / MERRA-2.
Limiti: https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/ richiede richieste non più fini della risoluzione originaria e limita abusi, senza SLA. Una chiamata per cella/anno, cache di 7 giorni, richieste concorrenti duplicate accorpate per istanza. Cache distribuita globale e rate limit applicativo da completare prima di traffico elevato.
Copertura globale, Italia inclusa, griglia 0,5° lat × 0,625° lon. Stima indicativa di contesto, inadatta al singolo comune/immobile o microclima; non media sul poligono. Celle condivise possono dare valori identici a comuni diversi. Centro della cella più vicino al punto interno ISTAT, esplicitato nella provenienza.
Anno 2025 fisso, gennaio-dicembre, tempo solare locale. Non è una normale climatica pluridecennale. Temperatura: media delle T2M giornaliere; caldo: conteggio Tmax > 30 °C (soglia descrittiva); pioggia: somma PRECTOTCORR giornaliera (mm/day × 1 giorno). Richiesti tutti i giorni: null/-999/giorni assenti/unità inattese non diventano zero né annualizzazioni.
Conservati: risposta originale, URL, SHA256, timestamp acquisizione, periodo, griglia e metodo. Data aggiornamento upstream non fornita: null.
Affidabilità media per contesto regionale, insufficiente per microclima. Nessun punteggio.
Verifica: risposta reale HTTP 200, 365 giorni 2025 per la cella 45,5 N / 9,375 E, unità C e mm/day, sorgenti MERRA2/POWER. Test negativi ottenuti alterando questa risposta reale, mai mostrati nel prodotto.

## GIBS Blue Marble Next Generation
API WMTS: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
Capabilities verificato HTTP 200: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml
Layer BlueMarble_NextGeneration, GoogleMapsCompatible_Level8, JPEG 256px, zoom massimo nativo 8. Mosaico storico MODIS, risoluzione nominale circa 500m. Non una ripresa live, non adatto a edifici o strade. Epoca esatta del mosaico restituito da questo layer statico non dichiarata nel capabilities: non dedotta dall'anno della pagina o da altri mosaici Blue Marble.
Dati e limiti: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/
Uso/attribuzioni: https://nasa-gibs.github.io/gibs-api-docs/ e https://www.nasa.gov/nasa-brand-center/images-and-media/ . Visualizzazione informativa di materiale NASA, nessun logo, nessun endorsement; nessun dataset commerciale CSDA.
Nessuna chiave, nessuna quota/SLA numerica verificata; richieste on-demand browser senza download massivo. Non alimenta indicatori.

## Satellite locale opzionale
MapTiler satellite-v2, chiave propria; https://www.maptiler.com/terms/cloud/ . Piano Free limitato a non commerciale e R&D; attività commerciale con piano verificato. Attivazione solo con VITE_MAP_PROVIDER=maptiler, VITE_MAPTILER_KEY e VITE_MAP_USAGE=research-development oppure commercial-plan-verified. Nessuna chiave di esempio riutilizzata. Risoluzione/epoca variano; non dichiarare 3D fotorealistico di edifici. Chiave frontend pubblica da limitare agli origin autorizzati. Attribuzioni del TileJSON mantenute.
