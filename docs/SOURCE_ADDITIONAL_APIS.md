# Dossier delle nuove fonti

Revisione: 5 ottobre 2026. L'integrazione è limitata ai dati e alle modalità descritte sotto. I provider sono intercambiabili tramite `IndicatorProviders`; i dati originali non vengono sovrascritti da punteggi.

## ISPRA IdroGEO

- API ufficiale: `https://idrogeo.isprambiente.it/api/pir/comuni/{codice_istat}`. Specifica OpenAPI: `https://idrogeo.isprambiente.it/api/`. Operazione pubblica GET, nessuna autenticazione necessaria per i dati PIR comunali verificati.
- Licenza: **CC BY 4.0 per gli aggregati**. Verificata nel PDF specifico, conservato in `docs/sources/ispra-licenza.pdf`. Non applicare automaticamente questa licenza ai poligoni: le mappe alluvionali hanno condizioni diverse.
- Condizioni: https://idrogeo.isprambiente.it/app/page/toc e https://idrogeo.isprambiente.it/app/page/open-data. Le pagine pubbliche sono disponibili anche nel CMS ufficiale: `https://idrogeo.isprambiente.it/cms/wp-json/wp/v2/pages?slug=open-data,toc`.
- Dizionario corrente: https://idrogeo.isprambiente.it/cms/wp-content/uploads/2025/07/Metadati_PIR.csv, copia in `docs/sources`. Attenzione: il vecchio file `/app/assets/data/Metadati_open_data_PIR.xlsx` ha riferimenti precedenti e non è quello utilizzato.
- Campi: `aridp2_p` = superficie P2 alluvioni, anno 2020; `ar_frp3p4p` = superficie P3+P4 frane, anno 2024; `pop_res021`, `pop_gio_p`, `pop_anz_p` = censimento ISTAT 2021. Gli aggregati sono sui limiti ISTAT 2024. Le percentuali originali non vengono ricalcolate.
- Copertura: nazionale per i codici esposti dalla fonte, non garantita per ogni comune vigente nel 2026. Nessuna fusione o riassegnazione automatica di valori.
- Validazione: codice richiesto uguale a `pro_com`, schema territoriale presente; null, campi assenti, -1, numeri non finiti, percentuali fuori 0–100 e conteggi non interi restano mancanti. Non si interpreta un errore come zero.
- API senza timestamp di aggiornamento del record: `sourceUpdatedAt=null`. L'anno viene dai metadati luglio 2025, non dalla data di download. Cambiamenti futuri della versione dell'API o dei metadati richiedono nuova revisione; non è implementato un rilevamento automatico dell'edizione.
- Limiti/SLA: soglia numerica non dichiarata nella specifica consultata. Timeout 20 s, cache 24 ore, deduplicazione, nessun retry automatico su 429. Non si effettua un download massivo a ogni visita.
- Affidabilità: media per la lettura territoriale, con epoche e limiti espliciti. ISPRA non garantisce completezza o aggiornamento. Non è un sistema di allerta né una verifica di sicurezza immobiliare; le mosaicature non sostituiscono cartografia e vincoli delle autorità competenti.
- Attribuzione: ISPRA (2024), Pericolosità e indicatori di rischio frane; ISPRA (2020), Pericolosità e indicatori di rischio alluvioni; piattaforma IdroGEO. Demografia da censimento ISTAT 2021. Estrazione: Che luogo è?

## Ministero della Salute — Farmacie

- Scheda ufficiale: https://www.dati.salute.gov.it/it/dataset/farmacie/. Download JSON del 5 ottobre 2026: https://www.dati.salute.gov.it/sites/default/files/opendata/FRM_FARMA_5_20261005.json.
- Accesso: file JSON ufficiale, **non API di interrogazione comunale nativa**. Importazione singola e consultazione tramite API del nostro Worker. La fonte aggiorna giornalmente; il sito usa uno snapshot fino alla successiva importazione/pubblicazione.
- Licenza IODL 2.0, dichiarata nella scheda. Attribuzione obbligatoria. Riuso commerciale consentito: conferma istituzionale in https://docs.italia.it/italia/icdp/icdp-pnd-dmp-docs/it/consultazione/allegato-faq-per-la-pubblicazione-dei-dati-aperti.html. Testo della licenza: https://www.dati.gov.it/iodl/2.0/ (il link ha restituito 403 all'ambiente di ricerca; la conferma istituzionale e la licenza dichiarata dal titolare sono state consultate).
- Dizionario v2.0 conservato in `docs/sources/farmacie-dizionario.pdf`: `cod_comune` è ISTAT, `cod_farmacia` è l'identificativo univoco; tipologie 1 ordinaria, 2 succursale, 3 dispensario, 4 dispensario stagionale. Non si usano coordinate, alcune delle quali provengono da OSM.
- Originale integrale, ricostruibile byte per byte: `data/original/farmacie.json.gz`; SHA-256 e acquisizione in `server/data/pharmacies-manifest.json`. Dati originali partizionati per provincia negli asset per evitare di incorporare il download nel Worker.
- Metodo v1: inizio di validità <= data snapshot; fine >= data snapshot oppure `-` come fine aperta. Estremi inclusivi dichiarati. Unicità per codice ministeriale. Record attivi in conflitto, date non interpretabili o tipologie sconosciute sospendono il conteggio del comune. Nessun record per il codice corrente => null. Una farmacia cessata non viene contata tra le attive.
- Copertura verificata sull'anagrafica corrente: 6.731 comuni con conteggi calcolabili; 1.162 senza record associato al codice corrente; 1 con record da chiarire. Il totale è 7.894. Queste assenze non sono censimenti di “comuni senza farmacia”.
- Affidabilità media: registro istituzionale, ma validità anagrafica diversa da apertura, turni e accessibilità; stagionalità dei dispensari e possibili ritardi nelle ricodifiche. Copertura percentuale reale non stimata.
- Per aggiornare: scaricare il JSON corrente dalla scheda ufficiale, verificare schema/licenza/data, quindi `node scripts/import-pharmacies.mjs PERCORSO_JSON DATA_ISO URL_UFFICIALE`, test, commit e nuova pubblicazione. La build ordinaria non scarica dati da Internet.

## GBIF

- API: https://api.gbif.org/v1/occurrence/search. Specifica https://techdocs.gbif.org/en/openapi/v1/occurrence; termini https://www.gbif.org/terms/data-user e https://www.gbif.org/terms.
- Ricerca pubblica senza chiave. Le licenze sono per dataset: si includono **solo record CC0_1_0**, compatibili con uso commerciale. CC BY e CC BY-NC esclusi da questa prima implementazione, quindi il conteggio non rappresenta l'intera banca dati.
- Filtro: paese IT, anno 2015–2025, coordinate presenti, nessun problema geografico segnalato, presenza dichiarata; intervalli latitudine/longitudine dal bbox della geometria ISTAT. `limit=0` restituisce il conteggio senza scaricare dati di specie o localizzazioni puntuali.
- Granularità: **riquadro**, include aree esterne al comune. Non viene presentato come conteggio dentro il poligono. Non misura specie uniche, habitat, superficie protetta o biodiversità; possibili duplicati biologici e forte bias di campionamento.
- Schema del conteggio verificato; risposta originale, query esatta, SHA e data conservati. Zero valido solo quando restituito dall'API dopo validazione: significa nessun record corrispondente ai filtri. Timeout o risposta non valida => errore, senza sostituzione.
- Affidabilità bassa per descrivere la biodiversità del luogo. Nessuna copertura percentuale inferita. Nessun tentativo di ricostruire coordinate oscurate per specie sensibili.
- Limiti: query di ricerca, nessun download massivo; cache 24 ore, timeout 20 s, nessun retry su 429. Non è stato verificato uno SLA di disponibilità.

## Aria CAMS tramite Open-Meteo

- Fonti: https://open-meteo.com/en/docs/air-quality-api, https://open-meteo.com/en/terms, https://open-meteo.com/en/pricing.
- L'accesso gratuito è non commerciale. Provider implementato esclusivamente per `https://customer-air-quality-api.open-meteo.com/v1/air-quality`, con secret `OPEN_METEO_API_KEY`. Il piano va attivato dall'utente; senza chiave non si effettua alcuna chiamata.
- Dati CC BY 4.0; attribuzione CAMS ENSEMBLE e Open-Meteo nella pagina Fonti. L'autorizzazione all'accesso commerciale dipende dal piano; non è stato acquistato o verificato un abbonamento dell'utente.
- Dominio `cams_europe`, griglia 0,1° (~11 km). Richiesta di un solo istante, la prossima ora intera UTC. PM2,5, PM10, NO₂, ozono. Tipo `forecast`, mai `observed` o media annua.
- Validazione di coordinate della cella, istante UTC, unità e valori non negativi. Modello documentato nella metodologia; incertezza numerica ed emissione del run non fornite dalla risposta, senza inventarle.
- Cache 10 minuti, richieste accorpate e timeout. Quote e costi dipendono dal contratto. Chiave conservata soltanto lato Worker; URL pubblici privi del secret.
- Non collaudata la chiamata autenticata in assenza di credenziali. Verificati il blocco senza chiave e il rifiuto di payload incompatibili. Le medie annuali PM2,5/PM10 restano non integrate.

## Limiti comuni

Cache Cloudflare locale al punto di presenza e memoria per istanza, non un archivio storico globale o un limite di spesa distribuito. Nessuna imputazione dei dati mancanti. Nessuna API immobiliare, di criminalità, GTFS, raster Copernicus o intersezione Natura 2000 ancora approvata e collegata in questo aggiornamento.
