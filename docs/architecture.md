# Angular Enterprise Starter - Architecture Guidelines

## Obiettivo

Questa base progetto definisce una struttura enterprise chiara, scalabile e facilmente mantenibile.
Le regole sotto sono il contratto d'uso consigliato per tutti i team che adottano lo starter.

## Struttura base

- `src/app/core`: infrastruttura applicativa singleton (config, auth, guards, interceptors, logger, error handling).
- `src/app/shared`: componenti, directive, pipe e utility riusabili e indipendenti dal dominio.
- `src/app/layout`: shell globale (header, sidebar, footer, content wrapper).
- `src/app/features`: moduli funzionali di business (es. users, orders, settings), caricati in lazy loading.

## Direttive d'uso

1. `core` non contiene componenti UI di business.
2. `shared` non contiene logica di dominio né stato applicativo globale.
3. Ogni feature deve essere autonoma e organizzata in sottocartelle dedicate (`pages`, `components`, `services`, `models`, `routes`).
4. Le feature non si importano tra loro direttamente.
5. Dipendenze consentite:
   - `features -> shared/core`
   - `layout -> shared/core`
   - `shared -> nessuna feature`
   - `core -> nessuna feature`
6. Tutte le feature devono essere lazy-loaded.
7. Il routing root deve comporre layout e feature, non logica di business diretta.
8. L'accesso HTTP deve passare da service/data-access layer, non da componenti presentazionali.
9. DTO e model di dominio vanno mantenuti separati con mapping esplicito.
10. Ogni feature nuova deve includere almeno test base per page/service principali.

## Convenzioni consigliate

- Naming componenti: `feature-name-page`, `feature-name-card`, `feature-name-form`.
- Naming file: `kebab-case`.
- Preferire componenti standalone e API Angular moderne.
