# HEPHAEST

Application web de musculation, de suivi de progression et de coaching. Slogan : « Forge ta progression. »
Projet personnel, budget zéro, conçu pour pouvoir grandir.

## Au démarrage de chaque session

1. Lire `docs/progress.md` : ce qui est fait, la prochaine étape, les points ouverts.
2. `git log --oneline -15` pour voir les derniers commits.
3. Vérifier dans Jira (projet **SCRUM**) le statut des tickets de l'étape en cours.
4. Présenter le plan du prochain ticket avant de coder.

## Documentation (à lire selon le besoin, pas en entier)

- `docs/cahier-des-charges.md` : vision, règles métier, critères d'acceptation AC-01 à AC-12,
  modèle de données. Consulter la section concernée avant d'implémenter un ticket.
- `docs/decisions.md` : arbitrages déjà tranchés. **Prioritaire sur le cahier des charges**
  en cas de contradiction.
- `docs/progress.md` : état d'avancement, à mettre à jour en fin de session.

Les règles détaillées sont dans `.claude/rules/` (workflow Jira, commits, Vue, CSS, données, tests).

## Stack

pnpm · Vite · Vue 3 (`<script setup lang="ts">`) · TypeScript strict · Pinia · Vue Router ·
Zod · CSS classique (pas de Tailwind) · `@lucide/vue` · Vitest · Supabase prévu (pas encore branché).

## Structure

```
src/
  app/          # App.vue, router, layouts, navigation
  components/   # composants partagés (ui/ = design system)
  domains/      # auth, training, exercises, programs, progress, calendar, coaching, admin
  services/     # contrats d'accès aux données + adaptateurs (local/ pour l'instant)
  stores/       # stores Pinia transverses (session, toasts)
  styles/       # tokens.css, base.css, typography.css
  types/        # modèle de domaine partagé
```

## Commandes

| Commande             | Rôle                                         |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Serveur de développement                     |
| `pnpm test`          | Tests Vitest (une passe)                     |
| `pnpm type-check`    | Vérification TypeScript                      |
| `pnpm lint:check`    | Oxlint + ESLint + Stylelint sans correction  |
| `pnpm build`         | Types puis build de production               |
| `pnpm build:preview` | Build statique avec routage en hash (aperçu) |

Avant chaque commit : `pnpm test`, `pnpm type-check` et `pnpm lint:check` doivent passer.

## Langue

Interface et documentation en français, tutoiement dans l'UI. Code, noms de variables et
messages de commit en anglais.
