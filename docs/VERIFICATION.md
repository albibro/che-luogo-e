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
