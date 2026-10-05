# Dossier fonte attiva: ISTAT SITUAS

Revisione: 4 ottobre 2026. Ambito approvato: riuso dell’anagrafica ufficiale dei comuni tramite snapshot API con attribuzione. Non autorizza automaticamente altre integrazioni ISTAT.

## Evidenze e condizioni

- Fonte ufficiale e rinvio a SITUAS: https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/
- Licenza generale dei dati diffusi ISTAT: https://www.istat.it/dati/open-data/
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- Endpoint effettivamente acquisito: https://situas-servizi.istat.it/publish/reportspooljson?pfun=61&pdata=04/10/2026

Licenza consente riuso, adattamento, redistribuzione e uso commerciale con attribuzione, collegamento alla licenza e indicazione delle modifiche. Conservare: “Fonte: Istat, SITUAS. Dati normalizzati da Che luogo è?”. Non suggerire approvazione del prodotto da parte dell’ente.

L’endpoint pubblico ha restituito HTTP 200 e 7.894 record con 20 regioni e codici univoci. Nessuna chiave richiesta per questo download. Non sono stati verificati un SLA, un limite numerico documentato o un diritto a chiamate illimitate: non assumerli. Accesso upstream soltanto all’importazione; nessun polling o autocomplete diretto sul server ISTAT.

## Copertura, granularità, aggiornamento

Unità comunali vigenti alla data richiesta nell’API. Nome originale multilingue e nome italiano, codice ISTAT, regione, unità sovracomunale, codici amministrativi. Nessuna coordinata, confine, popolazione o misura ambientale inclusi in questo report.

Data di riferimento distinta da data di download. Data di aggiornamento del record non fornita: null. Il numero di comuni e la codifica cambiano con fusioni e riordini. I codici sardi attuali sono quelli restituiti dal report, senza sostituzione con repertori precedenti. Una futura unione con dati storici deve usare tavole di corrispondenza temporale.

## Affidabilità e trasformazioni

Affidabilità alta per l’identità amministrativa, poiché registro dell’autorità statistica nazionale; non è una garanzia di disponibilità continua dell’API. Nessuna inferenza sulla qualità del comune.

Record originali conservati. Normalizzazione di accenti e punteggiatura solo per ricerca e slug; nome mostrato invariato. Slug include codice per disambiguazione. Conteggio in homepage derivato dal numero dei record acquisiti. SHA-256 del payload e metadati salvati nel manifesto. Non vengono creati indicatori o coordinate mancanti.

## Aggiornamento operativo

Importatore riproducibile `scripts/update-istat.py`; controlli schema, unicità e copertura precedono la scrittura. Controlli hash e lookup nazionale in test. Revisione e commit necessari prima del rilascio. Nessun cron attivato. In caso di fallimento validazione il precedente dataset rimane utilizzabile e non deve essere etichettato come aggiornato.
