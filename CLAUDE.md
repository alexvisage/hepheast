# HEPHAEST — consignes pour Claude Code

Application web de musculation et de coaching. Cahier des charges : `docs/` (à venir) et Jira.

## Jira

- Site : `hepheast.atlassian.net`, projet **SCRUM** (« Hepheast - Dashbord sportif »)
- Hiérarchie : Epic → Story / Tâche → Subtask. Les sous-tâches sont l'unité de travail.
- Statuts : « À faire » → « En cours » → « Terminé » (« En cours de revue » si un point reste à valider).

### Workflow ticket par ticket

1. Choisir la prochaine sous-tâche « À faire » de l'Epic en cours, par priorité.
2. La passer « En cours » (et son parent s'il est encore « À faire »).
3. Implémenter uniquement ce que décrit le ticket.
4. Vérifier : `pnpm test`, `pnpm type-check`, `pnpm lint:check`. Tout doit passer.
5. Un commit par sous-tâche (plusieurs si le travail se découpe naturellement).
6. Passer la sous-tâche « Terminé ». Si une partie manque (ex. backend Supabase pas prêt),
   la laisser « En cours » et ajouter un commentaire qui dit ce qui reste.
7. Quand toutes les sous-tâches d'un parent sont terminées, passer le parent « Terminé ».

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/), **en-tête seul, sans corps**.
- Format : `type(scope): description en anglais à l'impératif (SCRUM-XX)`
- Exemple : `feat(training): add rest timer with auto start (SCRUM-142)`
- Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `build`, `ci`.
- commitlint et lint-staged s'exécutent via husky ; ne jamais les contourner (`--no-verify`).

## Stack et conventions

- pnpm, Vite, Vue 3 (`<script setup lang="ts">` uniquement), TypeScript strict, Pinia, Vue Router.
- **CSS classique, pas de Tailwind.** Styles en `<style scoped>`, classes BEM
  (`bloc__element--modif`), toutes les valeurs passent par `src/styles/tokens.css`.
  Stylelint refuse les couleurs en dur.
- Icônes : `@lucide/vue`. Police : Archivo variable auto-hébergée.
- Accès aux données uniquement via `src/services` (contrats dans `contracts.ts`).
  L'adaptateur local actuel sera remplacé par Supabase sans toucher à l'UI.
- Pas de logique métier dans les composants de présentation : stores ou modules du domaine.
- Validation de formulaires avec Zod (`src/services/validation.ts`).
- Accessibilité WCAG 2.2 AA : libellés explicites, focus visible, cibles tactiles ≥ 48 px,
  jamais d'information par la couleur seule, `prefers-reduced-motion` respecté.
- Textes de l'interface en français, tutoiement.

## Commandes

| Commande             | Rôle                                         |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Serveur de développement                     |
| `pnpm test`          | Tests Vitest (une passe)                     |
| `pnpm type-check`    | Vérification TypeScript                      |
| `pnpm lint:check`    | Oxlint + ESLint + Stylelint sans correction  |
| `pnpm build`         | Types puis build de production               |
| `pnpm build:preview` | Build statique avec routage en hash (aperçu) |
