# Roadmap API — stato al 6 ottobre 2026

La UI usa l’API del Worker per tutti gli indicatori. Una fonte con download ufficiale viene importata e servita dalla nostra API, senza essere descritta come API nativa in tempo reale. Nessun dato simulato, nessun voto complessivo.

| Categoria | Collegato nel pacchetto | Ancora da completare |
| --- | --- | --- |
| Identità e territorio | Anagrafica nazionale ISTAT; superficie 2024 e beni culturali ICR via ISPRA | Aggiornamento dei confini, cinque geometrie mancanti, ricerca per indirizzo |
| Clima | NASA POWER 2025: media temperatura, giorni Tmax >30 °C, pioggia annua | Serie pluriennali e indicatori ulteriori previa verifica |
| Rischi naturali | Frane P3+P4 2024; alluvioni P1/P2/P3 2020 | Fonte sismica INGV: prodotto, licenza e scenario da verificare |
| Aria | Adapter per quattro previsioni orarie CAMS/Open-Meteo | Secret commerciale e collaudo autenticato; medie annue validate |
| Servizi | Farmacie, succursali, dispensari | Ospedali/pronto soccorso; trasporti GTFS; servizi di prossimità da provider autorizzato |
| Demografia | Censimento 2021: residenti, fasce di età, famiglie | ISTAT aggiornato, serie con confini coerenti, cittadinanza |
| Scuole | MIM statali e paritarie 2026/27, tipologie statali ed elenco sedi | Registri autonomie Aosta/Trento/Bolzano; nessun giudizio di qualità |
| Redditi e lavoro | MEF 2024: contribuenti, frequenze e medie fiscali; ASIA unità locali 2022 via ISPRA | Tasso di occupazione da fonte e scala verificate |
| Natura | GBIF CC0 nel riquadro; consumo di suolo ISPRA 2024 e variazione/ripristino | Copernicus copertura arborea; intersezione Natura 2000 con geometrie e condizioni verificate |
| Case e affitti | Catalogo di indicatori e ragioni dell’assenza | Contratto, API e diritto di redistribuzione OpenAPI/OMI; zone/tipologie/semestre distinti |
| Sicurezza | Catalogo di indicatori e ragioni dell’assenza | Flusso ufficiale Istat/Interno, dati provinciali dichiarati come tali, conteggi/tassi/andamento |
| Connettività | AGCOM FTTH DESI, FTTH 20m, famiglie raggiunte stimate al 30 giugno 2026 | 5G e soglie di banda da strati distinti, da importare e verificare |
| Mappa | Globe MapLibre, confini reali, strade/rilievo; satellite Esri predisposto | Chiave Esri e collaudo grafico del globo; niente edifici da altezze inventate |
| Confronto e rilascio | Routing e API sostituibili, test automatici, pacchetto cumulativo | Confronto compatibile per epoche/metodi, collaudo mobile/accessibilità, SEO comunale, deploy utente |

Catalogo: 12 categorie, 58 indicatori, di cui 35 collegati senza nuove credenziali, 4 subordinati alla chiave aria, 19 da integrare. La disponibilità effettiva varia per comune e fonte. Dossier: `SOURCE_CONTEXT_APIS.md`, `SOURCE_ADDITIONAL_APIS.md`, `SOURCE_NASA.md`, `SOURCE_GEOGRAPHY.md`, `SOURCE_ESRI.md`.

Passaggi per ogni prossima fonte: dossier su licenza/copertura/accesso → prova con risposta reale → adapter con originali e provenienza → test degli errori e dati mancanti → integrazione nell’interfaccia. Aggiornamenti cumulativi, senza chiedere all’utente deploy intermedi.

Le API protette o a pagamento non si attivano con chiavi di terzi. Le schede previste non equivalgono a integrazioni implementate. Importazioni D1, KV e R2 restano evoluzioni architetturali; non sono richieste per pubblicare questo pacchetto.
