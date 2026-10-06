# Dashboard e confronto — 6 ottobre 2026

## Dashboard comunale

La scheda si apre sui dati, con mappa e identità disponibili nel pannello espandibile in alto. Il componente 3D viene caricato quando si apre il pannello.

- Quattro indicatori in evidenza: residenti, reddito medio dichiarato, consumo di suolo e fibra FTTH. Cliccando si apre la categoria corrispondente.
- Pannelli per tema con valori, barre percentuali, epoche e fonti. Le percentuali restano indipendenti; gli scenari di rischio non vengono sommati.
- Composizione per età solo se le tre quote originali sono presenti e coerenti con 100%, entro gli arrotondamenti della fonte. Nessuna ricostruzione della quota mancante.
- Brevi letture automatiche dei dati disponibili: denominatore della media fiscale, fasce di età, variazione netta del suolo. Nessuna valutazione di attrattività, sicurezza o qualità del luogo.
- Scuole consultabili per nome e indirizzo. Record originali, metodo e limiti restano nelle schede espandibili.
- Stato delle fonti, errori, configurazioni richieste e download in un pannello dedicato, con pulsante di riprova.

Le sezioni senza dati non generano grafici, zeri o numeri dimostrativi. Nessuna serie temporale viene disegnata a partire da un unico valore annuale.

## Come usare Confronta

1. Apri **Confronta** nel menu oppure **Confronta un altro comune** dalla dashboard.
2. Cerca e seleziona Comune A e Comune B. La selezione dalla dashboard precompila A.
3. Apri una categoria o selezionala nei filtri. Di default vengono mostrati soltanto gli indicatori confrontabili; disattiva la casella per vedere anche le assenze e le incompatibilità.
4. Ogni riga mostra i due valori, le date, le fonti e la differenza B − A. **Scambia A e B** cambia l’ordine e il segno della differenza.
5. **Copia link al confronto** conserva selezioni e filtri nell’URL. Se gli appunti non sono accessibili, copia l’indirizzo dalla barra del browser.

URL applicativo: `/confronta?a=carimate-013046&b=roma-058091`. Gli identificativi sono risolti dalle stesse API nazionali della ricerca, senza endpoint o chiavi aggiuntivi. La rotta è inclusa nel prerender e funziona anche con accesso diretto dopo il deploy.

## Regola di compatibilità, versione 1

La differenza è calcolata solo se entrambi i valori sono finiti e non null, l’indicatore coincide e sono uguali: periodo completo, unità, tipo osservato/elaborato/previsione, fonte, versione documentata del metodo, livello e descrizione della risoluzione geografica.

I valori percentuali vengono sottratti in **punti percentuali**. Non è calcolata una variazione relativa, quindi un valore A pari a zero non introduce divisioni per zero. Gli input originali restano disponibili, senza sostituzione con il risultato del confronto.

Segnalazioni GBIF su bounding box escluse dal calcolo della differenza: aree e sforzo di raccolta non equivalenti. Per i dati NASA sulla stessa cella viene mostrato un avviso esplicito: l’uguaglianza non prova che i microclimi siano uguali. Le previsioni devono riferirsi allo stesso istante, oltre che allo stesso modello/metodo.

Le barre della coppia hanno origine zero e scala condivisa per quella riga. Non confrontare lunghezze tra righe diverse. Nessuna barra per temperature Celsius o valori negativi; i valori numerici restano leggibili. Blu e ocra identificano A e B, non migliore/peggiore. I conteggi assoluti dipendono dalle dimensioni del comune.

La compatibilità tecnica non garantisce uguale rappresentatività o completezza: i limiti della fonte accompagnano entrambi i valori. Un errore di una fonte non blocca gli altri indicatori. Cambiando selezione, le richieste precedenti vengono annullate e i dati precedenti non restano associati al nuovo nome.

## Verifica e limiti

43 test automatici superati: incluse coppie MEF reali Carimate/Roma, valori mancanti, zero, incompatibilità di periodi/metodi/unità/tipi/risoluzioni, previsioni a ore diverse, stessa cella climatica, esclusione GBIF, rendering HTML e rotta diretta. Build TypeScript/Vite con prerender `/confronta` verificata; bundle Cloudflare controllato senza deploy.

Il browser dell’ambiente rifiuta l’anteprima locale (`ERR_BLOCKED_BY_CLIENT`): la verifica interattiva/visiva desktop e mobile non è stata completata. I test HTML non sostituiscono il collaudo nel browser. Nessun nuovo dato o nuova API integrati in questa revisione; restano le stesse limitazioni delle fonti e del satellite/aria con chiave. Indicizzazione delle schede e ricerca per indirizzo ancora incomplete.
