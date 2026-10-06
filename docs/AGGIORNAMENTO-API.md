> Pacchetto cumulativo aggiornato il 6 ottobre 2026: leggere prima `../LEGGIMI-AGGIORNAMENTO.md`. Include anche MEF, MIM, ISPRA suolo e AGCOM. Le istruzioni per il secret aria qui sotto restano valide.

# Aggiornamento API — 5 ottobre 2026

## Cosa è pronto

| Categoria | Dati disponibili | Accesso |
| --- | --- | --- |
| Rischi | Superficie in scenario alluvioni P2 (2020); frane P3+P4 (2024) | API pubblica ISPRA IdroGEO, senza chiave |
| Demografia | Residenti, quota sotto 15 anni e quota da 65 anni, censimento 2021 | API ISPRA, fonte originale ISTAT; dati storici |
| Servizi | Farmacie/succursali e dispensari, distinti | JSON nazionale Ministero della Salute importato il 5 ottobre 2026, esposto dalla nostra API |
| Natura | Segnalazioni GBIF CC0 2015–2025 nel riquadro del comune | API GBIF, senza chiave; non indice di biodiversità |
| Aria | Collegamento per PM2,5, PM10, NO₂ e ozono previsti alla prossima ora intera | Implementato, da attivare con chiave commerciale Open-Meteo |

Il clima NASA e la mappa già presenti restano disponibili. Nessun numero simulato nelle schede, nessun punteggio. Fonte, periodo, granularità, metodo, affidabilità e dati originali sono consultabili in ogni scheda. Risposte originali scaricabili; per le farmacie si scaricano i record originali relativi al comune.

## Aggiorna GitHub e Cloudflare

1. Estrai lo ZIP. Apri la cartella interna `che-luogo-e`: qui trovi `package.json`, `wrangler.jsonc`, `src`, `server`, `worker` e `public`.
2. In GitHub Desktop seleziona il repository del sito, poi **Repository → Show in Explorer** (su Mac: **Show in Finder**).
3. Copia **il contenuto** della cartella estratta nella cartella aperta da GitHub Desktop, sostituendo i file omonimi e includendo tutte le sottocartelle. Non creare una seconda cartella `che-luogo-e` dentro il repository. Conserva gli eventuali file di configurazione personali e le chiavi locali.
4. Torna in GitHub Desktop. In **Summary** scrivi `Integra API ISPRA, farmacie e GBIF`. Premi **Commit to main**, poi **Push origin**.
5. Cloudflare avvia la pubblicazione collegata a GitHub. Mantieni la configurazione Worker del sito: build `npm run build` (oppure `npm run check` per includere i test), deploy `npx wrangler deploy`. La directory principale deve contenere `package.json` e `wrangler.jsonc`.
6. Quando il deployment è riuscito, riapri la pagina di Carimate con un aggiornamento completo. Controlla anche Roma o Palermo. Le sezioni “Stato delle API” indicano errori o configurazioni mancanti; “Dato, fonte e metodo” mostra gli originali.

Per queste nuove fonti pubbliche non occorre creare D1, KV o R2. La cache usa il servizio Cache del Worker. Con più traffico servirà una gestione globale delle quote, soprattutto per servizi a pagamento.

## Attivare l’aria, solo se desideri usare Open-Meteo commerciale

Il codice non chiama il piano gratuito: è limitato all’uso non commerciale. Non è stato acquistato alcun piano e non è disponibile una chiave in questo progetto.

1. Su https://open-meteo.com/en/pricing scegli e attiva un piano che autorizzi il tuo utilizzo commerciale e l’Air Quality API. Controlla quote e condizioni del piano prima di acquistare.
2. Copia la chiave dal tuo account Open-Meteo.
3. Apri **Cloudflare → Workers & Pages → il Worker del sito → Settings → Variables and Secrets → Add**.
4. Seleziona **Secret**. Nel campo del nome incolla esattamente:

   ```text
   OPEN_METEO_API_KEY
   ```

5. Nel valore incolla la tua chiave e premi **Deploy**. Deve essere un secret del Worker in esecuzione, non una variabile della sola build.
6. Ricarica la categoria Aria: le quattro schede “previsione oraria” tenteranno la chiamata autenticata. Il collaudo del piano autenticato sarà possibile soltanto dopo questa configurazione.

Non mettere la chiave nei file React, nel repository o in una variabile con prefisso `VITE_`. Le impostazioni Esri del satellite sono separate e continuano a seguire `ATTIVARE-SATELLITE-ESRI.md`.

La previsione CAMS è su griglia di circa 11 km: non è una centralina comunale. Le schede “media annua” restano distinte e non disponibili fino all’integrazione di una serie annuale validata.

Riferimenti ufficiali:
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://open-meteo.com/en/docs/air-quality-api
- https://open-meteo.com/en/terms

## Cosa resta incompleto

Prezzi immobiliari, sicurezza, trasporto pubblico, copertura arborea e aree protette non sono ancora integrati. Demografia più recente, confronto tra comuni e ricerca per indirizzo restano da completare. L’assenza di una fonte non viene sostituita con stime o zeri. Non tutti i comuni hanno tutti gli indicatori: fusioni, codici storici, dati mancanti e indisponibilità dei servizi possono ridurre la copertura.

Il progetto aggiornato è stato verificato localmente; non è stato pubblicato nel tuo account da questa sessione.
