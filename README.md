# Angular Enterprise Starter

Starter Angular pubblico con approccio enterprise-first e struttura modulare.

## Stato attuale

Il progetto e volutamente in una fase **unstyled base**:

- layout minimale con soli placeholder testuali (`Header`, `Sidebar`, `Main`, `Footer`)
- nessuna classe CSS nei template layout
- file SCSS layout vuoti per massima personalizzazione futura
- struttura cartelle enterprise gia pronta (`core`, `shared`, `layout`, `features`)
- routing root con redirect a `/dashboard`
- prima feature lazy disponibile in `features/dashboard`

Per il dettaglio completo:

- [Architecture Guidelines](./docs/architecture.md)
- [Current Status](./docs/current-status.md)

## Avvio rapido

```bash
npm install
npm run start
```

## Comandi principali

```bash
npm run lint
npm run format:check
npm run build
npm run test
```
