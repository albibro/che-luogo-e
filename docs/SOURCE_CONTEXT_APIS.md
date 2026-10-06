# Dossier fonti aggiuntive — verifica del 5 ottobre 2026

Il catalogo contiene 12 categorie e 58 indicatori: 35 collegati senza nuove credenziali, 4 previsioni aria implementate ma subordinate alla chiave commerciale, 19 ancora da integrare. Questi conteggi descrivono le funzionalità, non garantiscono disponibilità per ogni comune.

La UI usa sempre le API del Worker. MEF, MIM e ISPRA suolo pubblicano archivi: li importiamo e li esponiamo attraverso la nostra API. AGCOM distribuisce il CSV attraverso un endpoint ArcGIS pubblico, anch’esso importato. Nessuna di queste quattro integrazioni si aggiorna automaticamente durante la visita o il deploy. Gli originali sono conservati in `data/original`, i manifesti in `server/data`.

## Redditi MEF

- Fonte: [Open Data comunali MEF](https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes&search_class%5B0%5D=cCOMUNE).
- Licenza: CC BY 3.0, verificata nella [nota metodologica 2024](https://www1.finanze.gov.it/finanze/analisi_stat/public/v_4_0_0/contenuti/nota_metodologica_2024.pdf?d=1615465800), sezione Open Data. Attribuzione: MEF – Dipartimento delle Finanze. Copia della nota inclusa.
- Periodo: anno d’imposta 2024, dichiarazioni 2025; dati comunali, persone fisiche.
- Schema: codici ISTAT esatti; campi ammontare espressi in euro. Media = ammontare / frequenza della stessa voce, non / residenti o / tutti i contribuenti.
- Limiti: nominale, non netto disponibile o patrimonio; celle oscurate e spazi rimangono null. Nessuna ricostruzione delle celle protette. Unità territoriali storiche non riassegnate.
- Copertura verificata: 7.897 righe del file, una non associabile a un codice comunale a sei cifre conservata negli scarti. Corrispondenza esatta con 7.516 comuni dell’anagrafica corrente.
- Accesso: download pubblico senza chiave; nessuna quota numerica dichiarata verificata, nessuna richiesta upstream per visita. Aggiornamento manuale.
- Affidabilità: media nel prodotto, per periodo storico e limiti di rappresentatività. Originale fiscale mantenuto distinto dalle medie calcolate.

## Scuole MIM

- Fonte: [catalogo Scuole](https://dati.istruzione.it/opendata/opendata/catalogo/elements1/?area=Scuole), distribuzioni SCUANAGRAFESTAT e SCUANAGRAFEPAR 20262720260901.csv.
- Licenza: IODL 2.0 indicata dal catalogo di entrambi i dataset; attribuzione Ministero dell’Istruzione e del Merito.
- Riferimento: 1 settembre 2026, anno scolastico 2026/27. Unità anagrafiche, comprese eventuali sedi direttive; non edifici, classi, posti disponibili o valutazioni delle scuole.
- Associazione: CODICECOMUNESCUOLA è un codice catastale/Belfiore. Collegamento solo con una corrispondenza univoca nell’anagrafica ISTAT; nessun matching per nome o distanza.
- Copertura: 61.604 record dei due settori; 5 non associabili conservati separatamente; 6.700 comuni con almeno un record. Aosta, Trento e Bolzano esclusi dagli indicatori di questa importazione; i registri delle autonomie non sono stati integrati.
- Conteggi: codice scuola deduplicato per settore. Statali e paritarie separate; infanzia, primaria e primo grado limitati al settore statale. Nessun record in un settore → null. Tipologia assente in un settore censito → zero del conteggio, senza dichiarare un censimento perfetto.
- Accesso: CSV pubblici senza credenziali, nessuna chiamata al servizio SPARQL in produzione; nessun rate limit numerico verificato. Importazione manuale.
- Affidabilità: media per uso territoriale e amministrativo; nessuna inferenza sulla qualità. Nomi, tipologie, indirizzi e record originali consultabili.

## Consumo di suolo ISPRA/SNPA

- Fonte: [dati sul consumo di suolo](https://www.isprambiente.gov.it/it/attivita/suolo-e-territorio/suolo/il-consumo-di-suolo/i-dati-sul-consumo-di-suolo), XLSX edizione 2025, anni 2006–2024.
- Licenza: CC BY 4.0 esplicitamente indicata nel foglio Descrizione_campi. Originale completo e dizionario dei campi inclusi.
- Granularità: aggregati comunali della fonte; stock artificiale 2024, incremento netto e ripristino 2023–2024.
- Copertura: 7.896 record comunali; 7.516 associazioni esatte con l’anagrafica corrente. Nessuna ricostruzione per ricodifiche.
- Metodo: estrazione dei valori originali; ettari e percentuali distinti. Variazioni nette negative conservate. Non calcoliamo verde come 100 meno suolo consumato.
- Accesso: download pubblico senza chiave, nessun rate limit numerico verificato; parser XLSX solo durante l’importazione locale, non in Cloudflare.
- Affidabilità: media; classificazione cartografica e confini dell’edizione, non accertamento catastale o misura di biodiversità.
- Attribuzione: Munafò M. (a cura di), 2025, Consumo di suolo, dinamiche territoriali e servizi ecosistemici. Edizione 2025, Report ambientali SNPA, 46/2025.

## Fibra AGCOM

- Fonte: [reportistica comunale BBMap](https://geo.agcom.it/reportistica/ai/ai_251231_260210_comuni.html) e [metadati dell’elemento ArcGIS](https://geo.agcom.it/arcgis/sharing/rest/content/items/25830559c5784c1eb5eb1cf748889f4c?f=json).
- Licenza: CC BY 4.0, [condizioni BBMap](https://www.agcom.it/termini-e-condizioni). Attribuzione e logo prescritti presenti nelle schede; immagine originale inclusa, non ridisegnata.
- Versione: il nome della pagina indice contiene una data precedente. La data del dataset è ricavata dal titolo dell’elemento effettivamente scaricato, «Reportistica 260630 Comuni»: 30 giugno 2026. Timestamp di modifica ArcGIS distinto e conservato.
- Indicatori: copertura FTTH DESI, copertura FTTH su celle 20 m, famiglie raggiunte calcolate da AGCOM. Percentuali originali con virgola convertite in numeri senza ricalcolo.
- Copertura: 7.896 righe, associazioni esatte per codice ISTAT; totale corrente nel manifesto. Possibili incompletezze degli operatori, in particolare per le utilities di Bolzano segnalate in report precedenti: non assumiamo completezza per questa edizione.
- Limiti: stime di copertura, non speed test o garanzie al civico. Campi di confidenza conservati senza reinterpretarli come intervalli statistici. FTTH DESI e FTTH 20m distinti, non sommabili. 5G e altre soglie di banda non integrate.
- Accesso: distribuzione CSV via API ArcGIS pubblica senza chiave; nessuna quota numerica verificata. Download unico, consultazione della copia tramite nostra API.
- Affidabilità: media, elaborazioni AGCOM su dichiarazioni degli operatori.

## Riproduzione

Gli URL originali e le impronte SHA-256 sono nei manifesti. Nessuna chiave richiesta per queste quattro fonti. Importare soltanto file di una versione già verificata:

```sh
python3 scripts/import-context.py income /percorso/archivio-mef.zip
python3 scripts/import-context.py schools /percorso/statali.csv /percorso/paritarie.csv
python3 scripts/import-context.py soil /percorso/archivio-ispra.xlsx
python3 scripts/import-context.py broadband /percorso/archivio-agcom.csv
```

Solo l’importatore suolo richiede `openpyxl`; non è necessario installare Python per avviare o pubblicare il pacchetto. Gli asset sono già inclusi. Per aggiornare l’epoca occorre rivedere script, manifesti, testi dei provider e dossier insieme: non sostituire il file cambiando soltanto il nome.

Le partizioni contengono i record della fonte; le osservazioni normalizzate vengono calcolate separatamente. SHA-256 delle partizioni verificato a runtime. File assenti, alterati, record conflittuali o identità errate non generano dati sostitutivi.

## Categorie ancora incomplete

Il catalogo React include anche case/vendite/affitti/evoluzione, sicurezza provinciale, connettività mobile e altre soglie, occupazione, evoluzione demografica, cittadinanza, ospedali, servizi di prossimità, sismica, alberi e aree protette. Tutte hanno metodologia prevista e ragione dell’assenza, senza valori dimostrativi. Le fonti candidate non sono approvate automaticamente.

Case: nessun contratto OpenAPI/OMI o diritto di redistribuzione configurato. Sicurezza: nessun flusso ufficiale integrato; nessun valore provinciale attribuito al comune. Natura 2000: servizio e metadati individuati, ma verifica specifica e intersezione dei poligoni non completate; nessuna percentuale simulata.
