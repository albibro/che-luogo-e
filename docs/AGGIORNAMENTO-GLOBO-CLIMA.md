# Aggiornamento globo e clima — 5 ottobre 2026

## Pubblicare sul sito già esistente
1. Estrai lo ZIP aggiornato.
2. Apri GitHub Desktop, seleziona che-luogo-e, Repository → Show in Explorer.
3. Copia TUTTO il contenuto della cartella che-luogo-e estratta dentro la cartella clonata; sostituisci i file esistenti. package.json e wrangler.jsonc devono restare alla radice.
4. Summary: "Globo satellitare e indicatori climatici reali". Commit to main → Push origin.
5. Attendi la nuova pubblicazione Cloudflare. Build command consigliato: npm ci && npm run check; Deploy command: npx wrangler deploy.
6. Ricarica la pagina con Ctrl+F5. Apri Carimate: tre indicatori climatici del 2025 si caricano da NASA POWER tramite il Worker. Richiesta iniziale fino a 25 secondi, poi cache. Non servono nuove chiavi o database.

## Mappa
Globo: NASA Blue Marble, mosaico storico a risoluzione nominale di circa 500m; zoom limitato. Comune 3D: OpenFreeMap + terreno Mapterhorn (esagerazione 1:1), non edifici 3D. Il satellite NASA non mostra case: questo limite è esplicito, non viene nascosto con uno zoom artificiale. In pianura i rilievi reali possono essere poco visibili.

## Satellite con dettaglio locale (opzionale)
Per imagery di dettaglio il codice supporta MapTiler satellite-v2. È necessario un account/chiave propri e un piano adeguato: https://www.maptiler.com/terms/cloud/ . Free è limitato a non commerciale o ricerca e sviluppo; verificare piano prima di uso commerciale. Non attiviamo sottoscrizioni per tuo conto.
In Cloudflare → Worker → Settings → Build → Build Variables and Secrets, impostare:
- VITE_MAP_PROVIDER: maptiler
- VITE_MAPTILER_KEY: chiave pubblica browser del tuo account MapTiler
- VITE_MAP_USAGE: research-development (solo fase R&D) oppure commercial-plan-verified (solo dopo verifica del piano commerciale)
Limitare la chiave ai domini autorizzati dal pannello MapTiler. Queste variabili VITE sono incluse nel frontend, non sono segreti backend. Ricompilare il sito dopo ogni modifica.
Senza questi requisiti lasciare VITE_MAP_PROVIDER=openfreemap. Non usare chiavi di esempi pubblici.

## Cosa è reale e cosa manca
Reali: anagrafica ISTAT, confini validati ISTAT, mosaico NASA, rianalisi NASA POWER 2025.
Elaborati: coordinate dal poligono; selezione cella MERRA-2; tre aggregazioni annue. Griglia 0,5° × 0,625°: non medie comunali né valori di centralina, non normale climatica. Fonte, risposta originale, SHA e metodo visibili.
Non ancora integrati: aria, rischi, servizi, natura, demografia, case e sicurezza. Le schede ora dicono "Fonte da integrare", distinguendole dalle interruzioni di un’API già collegata. Nessun valore simulato, nessun punteggio totale.
Indirizzi e confronto ancora non implementati. noindex ancora attivo.
