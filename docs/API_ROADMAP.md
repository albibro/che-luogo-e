# Roadmap API

La UI usa API per ogni dato territoriale. Quando una fonte offre solo download, l’importazione automatizzabile alimenterà la nostra API: dichiarare il canale originale senza chiamarlo API nativa.

Il registro completo e i link ufficiali candidati sono in `server/sources.ts` e nella pagina Fonti e metodologia. Anagrafica e geometrie ISTAT sono integrate; servizi cartografici configurati con collaudo esterno ancora incompleto. Gli indicatori tematici non sono integrati.

| Fase | Contenuto | Candidati / canale | Prima dell’attivazione |
| --- | --- | --- | --- |
| Completata | Identità di tutti i comuni | API JSON ISTAT SITUAS | Dossier e snapshot verificati |
| In corso | Mappa 3D e confini | ISTAT via nostra API, OpenFreeMap, Mapterhorn; MapTiler alternativo | Confini integrati; collaudo WebGL/tessere e completamento delle geometrie mancanti |
| Successiva | Popolazione, età, variazioni | ISTAT SDMX | Dataflow, anno, granularità, codici, copertura |
| Successiva | Clima storico | Open-Meteo | Piano commerciale appropriato, griglia, periodo, rianalisi vs osservazione |
| Successiva | Aria | CAMS / Open-Meteo, centraline ufficiali | Licenze concatenate, griglia vs stazione, copertura temporale |
| Successiva | Frane e alluvioni | ISPRA IdroGEO | Versione, licenza, classi/scenari e compatibilità confini |
| Successiva | Servizi, scuole, salute | Geoapify, MIM SPARQL, Ministero Salute | Quote, attribuzione, censimento, licenza dataset e deduplicazione |
| Successiva | Natura | Copernicus, EEA Natura 2000, GBIF | Prodotto, risoluzione, anno, licenza per dataset e bias di osservazione |
| Successiva | Case | OpenAPI / dati OMI | Contratto, costi, cache e redistribuzione; quote per zona e tipologia |
| Successiva | Sicurezza | Istat / Interno | Disponibilità API e scala effettiva; nessun valore provinciale spacciato per comunale |
| Successiva | Redditi | MEF download → API applicativa | Licenza, anno fiscale, popolazione di riferimento |
| Successiva | Connettività | AGCOM | Riuso API/layer, epoca e copertura dichiarata vs misurata |
| Finale | Confronto e rilascio | Nostre API | Compatibilità periodi/metodi, mobile, accessibilità, SEO, test finale utente |

Per ciascuna: dossier → un indicatore completo con originale e provenienza → test → integrazione successiva. Non riempire assenze con numeri arbitrari.

Mappa: rilievo 3D, camera inclinata, livelli tematici con legende e provenienza; edifici estrusi solo con geometrie e altezze disponibili e legittimamente riutilizzabili. Non promettere Google Earth fotorealistico per tutta Italia. La componente grafica non deve nascondere incompletezza e incertezza dei dati.
