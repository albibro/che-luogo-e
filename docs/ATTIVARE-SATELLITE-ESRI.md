# Attivare Esri World Imagery sul sito

Il satellite richiesto è Esri World Imagery. Le immagini provengono da fornitori tra cui Maxar (Vantor nei crediti correnti), Earthstar Geographics e GIS User Community. È un unico servizio, non tre chiavi.

## 1. Aggiornare i file
Estrai lo ZIP. In GitHub Desktop → Repository → Show in Explorer, copia il CONTENUTO della cartella che-luogo-e estratta nella cartella clonata, sostituendo i file. Non creare un livello che-luogo-e dentro che-luogo-e. package.json e wrangler.jsonc devono essere alla radice. Commit to main → Push origin.

## 2. Creare la propria chiave ArcGIS
Guida ufficiale: https://developers.arcgis.com/maplibre-gl-js/access-tokens/create-an-api-key/
1. Usa un account ArcGIS Location Platform o ArcGIS Online abilitato alla creazione di credenziali. Per Location Platform: https://location.arcgis.com → My portal.
2. Nel portale: Content → My content → New item → Developer credentials → API key credentials.
3. Seleziona Public application. Nessun accesso ai tuoi item privati necessario (No item access).
4. Nei privilegi seleziona le basemap; il tutorial World Imagery richiama Location services → Basemaps → Static basemap tiles. Segui i privilegi disponibili per il tuo tipo di account: https://developers.arcgis.com/maplibre-gl-js/maps/raster-tile-basemaps/display-multiple-basemap-layers/
5. Imposta scadenza e referrer autorizzati per il TUO indirizzo Cloudflare workers.dev e l'eventuale dominio definitivo, seguendo il formato del pannello. Per sviluppo locale autorizza separatamente l'indirizzo localhost usato.
6. Dai un titolo, ad esempio "Che luogo è - basemap". Genera e copia il token. Non usare token di esempi altrui e non incollarlo in chat.
Prima dell'attivazione verifica termini, quote ed eventuali costi dell'account per il tuo utilizzo: https://developers.arcgis.com/maplibre-gl-js/terms-of-use/ . Il progetto non attiva un piano o un pagamento per tuo conto.

## 3. Impostare Cloudflare
Apri Workers & Pages → che-luogo-e → Settings → Build → Build Variables and Secrets.
- VITE_MAP_PROVIDER = esri
- VITE_ESRI_API_KEY = la tua chiave basemap appena generata
Sono variabili di BUILD, non solo runtime del Worker. Nessuna modifica a wrangler.jsonc necessaria. VITE_MAP_USAGE e VITE_MAPTILER_KEY non servono per Esri.
Questa è una credenziale per applicazione pubblica: il browser la usa per le tessere, quindi sarà visibile nel frontend. Per questo è limitata a basemap e domini autorizzati. Non usare chiavi private amministrative.
Salva e avvia una NUOVA build dal pannello Cloudflare (Retry build / nuovo commit). Poi Ctrl+F5 sul sito.

## 4. Verifica
- Il selettore Satellite deve caricare Esri World Imagery, con crediti Esri/Vantor/Earthstar correnti.
- + e −, rotella e pinch zoomano senza fermarsi a livello 8.
- "Vola a [comune]" avvicina al confine mantenendo il satellite.
- Globo torna alla vista planetaria; non reinizializza la mappa.
- Inclina e Orbita funzionano sulla stessa camera. Il terreno, quando disponibile, usa quote reali con esagerazione 1:1; nessuna mesh di edifici inventata.
- Un errore su una tessera non copre più l'intera mappa con il confine statico.

Se Satellite mostra "Da attivare", la chiave non era presente durante la compilazione. Se Esri rifiuta la richiesta, controlla scadenza, privilegi, referrer e quote. La chiave non è richiesta ai visitatori e non aggiunge un login al prodotto.

## Stato
20 test automatici e build passati. Metadati reali Esri verificati; nessuna chiave dell'utente disponibile nell'ambiente, quindi tessere autenticate e rendering finale da collaudare sul dominio pubblicato. Non promettiamo dettaglio uniforme o immagini live. Fonte e date dipendono dalle immagini effettive.
I tre indicatori climatici restano della stessa fonte NASA POWER. Le altre categorie restano da integrare e non sono riempite con dati simulati.
