# HEPHAEST

Application web de musculation, de suivi de progression et de coaching.
_Forge ta progression._

## Prérequis

- Node.js 22.18+ ou 24.12+ (voir `.nvmrc`)
- pnpm 10 (`corepack enable` active la version déclarée dans `package.json`)

## Démarrage

```sh
pnpm install
pnpm dev
```

## Scripts

| Commande          | Rôle                                        |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | Serveur de développement                    |
| `pnpm build`      | Vérification des types puis build de prod   |
| `pnpm preview`    | Prévisualiser le build                      |
| `pnpm test:unit`  | Tests unitaires et de composants (Vitest)   |
| `pnpm type-check` | Vérification TypeScript                     |
| `pnpm lint`       | Oxlint + ESLint + Stylelint                 |
| `pnpm format`     | Formatage Prettier                          |

## Structure

```
src/
  app/          # initialisation, routes, layouts
  components/   # composants UI partagés
  domains/      # un dossier par domaine fonctionnel
    auth/ training/ exercises/ programs/
    progress/ calendar/ coaching/ admin/
  services/     # accès aux données, validation, utilitaires
  stores/       # état Pinia transverse
  styles/       # design tokens et styles globaux (CSS classique)
  types/        # types partagés
```
