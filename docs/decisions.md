# Décisions

Arbitrages tranchés depuis le cahier des charges v1.0. En cas de contradiction avec
`cahier-des-charges.md`, **ce fichier fait foi**. Ajouter une entrée à chaque nouvelle décision.

| Date       | Sujet (CDC §17)      | Décision                                                    | Ticket    |
| ---------- | -------------------- | ----------------------------------------------------------- | --------- |
| 14/10/2026 | Backend              | Supabase (PostgreSQL), plan gratuit                         | SCRUM-23  |
| 14/10/2026 | Style                | CSS classique, pas de Tailwind                              | SCRUM-73  |
| 14/10/2026 | Données en attendant | Adaptateur local (localStorage) derrière des contrats typés | SCRUM-63  |
| 14/10/2026 | Gestionnaire         | pnpm                                                        | SCRUM-55  |
| 14/10/2026 | Commits              | Conventional Commits, en-tête seul, clé Jira en fin         | —         |
| 14/10/2026 | Graphiques           | ECharts en imports sélectifs, rendu SVG                     | SCRUM-180 |

Encore ouverts (CDC §17) : mode hors ligne (SCRUM-24), unités (SCRUM-25), source du catalogue
(SCRUM-26), inscription et plateformes (SCRUM-27), hébergement et offre (SCRUM-28), partage
coach (SCRUM-35/36). Propositions en cours : sauvegarde de reprise plutôt que hors ligne complet,
stockage valeur + unité avec affichage kg seul au lancement, catalogue maison, inscription libre,
PWA uniquement, gratuit.

---

## Backend : Supabase, plan gratuit

- **Pourquoi** : modèle relationnel (vrai PostgreSQL, migrable), Row Level Security pour
  appliquer les droits côté base (propriétaire, relation coach-client), authentification
  fournie, coût nul, passage au plan Pro sans changement de code.
- **Contraintes du plan gratuit et parades** :
  - pause après 7 jours sans requête → job planifié anti-pause (GitHub Actions, SCRUM-188) ;
  - 2 projets maximum → Supabase local (CLI + Docker) pour le dev, un projet en ligne ;
  - sauvegardes non garanties → `pg_dump` hebdomadaire via GitHub Actions (SCRUM-62) ;
  - grants Postgres explicites obligatoires pour la Data API → dans chaque migration (SCRUM-60).
- **Règles d'architecture** : le client Supabase n'est jamais appelé depuis un composant,
  uniquement via `src/services`. La logique métier sensible (versionnement, records,
  idempotence) va dans des fonctions Postgres ou Edge Functions.
- **Écartés** : API Node dédiée (hébergement payant, auth et droits à écrire), Firebase
  (NoSQL inadapté), PocketBase (auto-hébergement), Neon seul (pas d'auth ni RLS).
- Stack gratuite associée : front sur Cloudflare Pages / Netlify / Vercel, CI GitHub Actions,
  erreurs Sentry (offre gratuite).

## CSS classique

- Remplace « Tailwind CSS ou système CSS cohérent » du CDC §10.1.
- Tokens en custom properties (`src/styles/tokens.css`), `<style scoped>`, BEM, Stylelint.

## Adaptateur local de démonstration

- Les contrats `src/services/contracts.ts` isolent l'UI de la source de données.
- L'adaptateur local stocke tout dans le navigateur : utile pour développer l'UI sans backend,
  **aucune sécurité** (mots de passe hachés en SHA-256 côté client, uniquement pour la démo).
- Il sera remplacé par l'adaptateur Supabase sans modifier les composants.

## Graphiques : ECharts

- **Choix** : `echarts` en imports sélectifs (`LineChart`, `GridComponent`, `TooltipComponent`,
  `MarkPointComponent`, `SVGRenderer`), rendu **SVG** plutôt que canvas — net à tous les zooms,
  imprimable, déboguable.
- **Pourquoi** : de la marge si la section Progression grossit (zoom, brush, gros volumes de
  points), là où une courbe maison aurait demandé une réécriture.
- **Coût assumé** : 507 kB minifiés / **173 kB gzip**, isolés dans un lot `echarts-*.js` chargé
  seulement par `/progression` et `/design-system`, mis en cache une fois.
  `chunkSizeWarningLimit` relevé à 600 kB pour que l'alerte reste utile sur notre propre code.
- **Écartés** : Chart.js (plus léger mais canvas et moins extensible), courbe SVG maison
  (zéro dépendance, mais à réécrire dès qu'il faut plus qu'une ligne).
- **Règle qui va avec** : un graphique est toujours `aria-hidden` et **accompagné d'un tableau
  équivalent** — c'est le tableau qui porte les valeurs pour le clavier et le lecteur d'écran
  (CDC §9.2).

## Modèle de domaine étendu en cours de route

- `ScheduledWorkout` (CDC §11) ajouté avec le service `schedule` : le tableau de bord et le
  calendrier en dépendaient tous les deux. Le statut « manquée » **n'est pas stocké**, il se
  déduit d'une date passée sans séance liée — il ne peut donc pas devenir faux.
- `UserPreferences.autoRest` : le CDC §4.2 demande un minuteur « manuel et/ou automatique
  **en option** », donc une préférence et non une constante.

## Identité visuelle

- Palette : graphite (surfaces), cuivre (action), vert-de-gris (réussite), laiton (attente),
  braise (erreur). Thème sombre uniquement pour le moment.
- Police : Archivo variable, auto-hébergée (`@fontsource-variable/archivo`) ; largeur étirée
  pour les titres, condensée pour les chiffres de performance.
- Logo : monogramme provisoire (H + enclume) en attendant SCRUM-78.
- Nom : **HEPHAEST** (CDC). Le projet Jira s'appelle « Hepheast », à harmoniser.
