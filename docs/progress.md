# État d'avancement

Dernière mise à jour : 15/10/2026. À mettre à jour à chaque fin de session.

## Fait

- **Socle** (SCRUM-43, sauf PWA SCRUM-58) : Vite, Vue 3, TS strict, ESLint, Oxlint, Prettier,
  Stylelint, husky, lint-staged, commitlint, router avec layouts, Pinia.
- **Design system** (SCRUM-47, 48) : tokens avec tests de contraste AA, typographie Archivo,
  composants `ui/`, page `/design-system`.
- **Layouts** (SCRUM-50) : barre du bas mobile, barre latérale desktop, lien d'évitement,
  focus à chaque changement de page, mode focus pendant la séance.
- **Services** (SCRUM-63, en cours) : contrats typés + adaptateur local. Reste l'adaptateur
  Supabase.
- **Auth front** (SCRUM-84, 85, 69) : inscription, connexion, garde de routes, validation Zod.
- **Catalogue** (SCRUM-124, 127, 129) : recherche sans accents, filtres, favoris, fiche
  exercice avec dernière performance.
- **Séance active, début** (SCRUM-150, 134) : calcul du volume et résumé de séance, store de
  séance active (sauvegarde continue, reprise), écran de démarrage, chronomètre, fin/abandon.
- **Séance active, saisie** (SCRUM-125, 139, 140, 141) : sélecteur d'exercice en surcouche
  (`ExercisePickerDialog`, réutilisable en programme, favoris en tête), liste d'exercices avec
  ordre et retrait, ligne de saisie de série (répétitions, charge, statut, type, note), copie de
  la série précédente. Variante compacte `size="sm"` du `NumberStepper`, qui explique désormais
  toute correction de valeur hors bornes.
- **Minuteur de repos** (SCRUM-142, 143) : `restTimerStore` sur échéance absolue (juste même si
  l'onglet est ralenti, continue en changeant d'écran), barre collante avec ±15 s, pause et arrêt,
  démarrage automatique après validation d'une série selon la préférence `autoRest`, signal de fin
  (vibration + bip) dans `restSignal.ts`.
- **Fin de séance** (SCRUM-151) : dialogue de clôture (totaux, ressenti 1-5, note) puis écran
  récapitulatif `/entrainement/seance/recapitulatif`, qui relit la dernière séance terminée dans
  les services et affiche la définition du volume.
- **Dates** (SCRUM-91, 162) : `services/dates.ts` — clé de jour `YYYY-MM-DD` calculée dans le
  fuseau de l'utilisateur, arithmétique sur des minuits UTC (insensible à l'heure d'été), bornes
  de semaine selon `weekStartsOn`, grille de mois, formats français.
- **Tableau de bord** (SCRUM-178) : reprise de séance, prochaine séance planifiée avec
  « Démarrer », semaine en cours (pastilles par jour, séances, séries, volume, temps),
  régularité, dernière séance, raccourcis, état vide pour un nouveau venu.
- **Historique** (SCRUM-154, 156) : liste chronologique paginée (10 par page) avec filtres
  combinables période / exercice / muscle / équipement, et page de détail d'une séance passée
  (valeurs exactes, type de série, notes) partageant `SessionRecap` avec le récapitulatif.
- **Calendrier** (SCRUM-161, 165, 166) : vues mois / semaine / jour, navigation, statuts
  planifiée / terminée / manquée / déplacée par icône **et** libellé, résumé de la semaine,
  planification, déplacement (±1 jour ou date précise), annulation, « Démarrer » et
  « Voir le détail ». `ScheduledWorkout` ajouté au modèle et au service `schedule`.
- **Progression** (SCRUM-180, 181, 182) : ECharts en imports sélectifs (`LineChart` en SVG,
  couleurs lues dans les tokens), courbe charge max / volume / 1RM estimé, tableau équivalent,
  sélecteurs d'exercice et de période, formule d'Epley affichée.
- **Profil** (SCRUM-90) : nom affiché, unité, fuseau, premier jour de semaine, repos par défaut,
  démarrage automatique du repos, déconnexion. Validation Zod.
- **Programmes** (SCRUM-169, 170, 172, 175, 176) : modèle `Program` / `ProgramVersion` /
  `ProgramDay` / `ProgramExercise` avec versionnement (une version qui a servi est figée, la
  modifier en ouvre une nouvelle), service local, trois modèles de départ (full body,
  upper/lower, PPL), bibliothèque (créer, dupliquer, renommer, archiver, supprimer), éditeur
  (jours, exercices, prescriptions complètes), assistant d'activation qui planifie les séances
  au calendrier, et démarrage de séance pré-remplie depuis un jour de programme avec la
  prescription affichée à côté du réalisé.
- **Tests** : polyfill `<dialog>` et bouchon canvas 2D dans `src/__tests__/setup.ts` (jsdom
  n'implémente ni `showModal()` ni `getContext('2d')`, dont ECharts a besoin pour mesurer le
  texte des axes). `detach()` dans `storage.ts` pour figer ce qu'on enregistre : `structuredClone`
  refuse les proxys de Vue. 270 tests.

Stories laissées « En cours » car seule la partie front existe : SCRUM-51, 53, 96, 97, 98, 100,
101, 102, 103, 105, 106, 107, 110, 111, 112, 113, 114, 115, 116, 117.
Sous-tâches laissées « En cours » : SCRUM-137 et SCRUM-165 — le glisser-déposer reste à faire
dans les deux cas, les alternatives clavier et tactile sont en place.

## Prochaines étapes, dans l'ordre

**Le squelette du pratiquant est complet** : toutes les pages de la navigation existent et
fonctionnent de bout en bout. Alexandre ajoutera ses propres tickets pour préciser la suite ;
voilà ce qui reste identifié aujourd'hui :

1. **Records personnels** : SCRUM-29 (définition) puis SCRUM-184 (badge en séance, liste,
   récapitulatif). Décision prise le 15/10 : quatre records par exercice — charge max,
   meilleures répétitions à charge donnée, meilleur volume de séance, 1RM estimé. Calculés
   depuis les séries, jamais stockés ; il faut battre, pas égaler.
2. **Pause et reprise de séance** (AC de SCRUM-105) : `WorkoutStatus` prévoit `paused`, mais ni
   le store ni l'UI ne l'utilisent. Aucune sous-tâche front ne le couvre : à créer.
3. **Glisser-déposer** : exercices d'une séance (SCRUM-137), séances du calendrier (SCRUM-165),
   jours et exercices d'un programme (SCRUM-169). Les trois ont leur alternative clavier.
4. **Progression de charge configurable** (CDC §6.2, AC de SCRUM-115) : aucune hausse n'est
   proposée pour l'instant, ce qui est conforme mais minimal.
5. **Période personnalisée** sur la progression (AC de SCRUM-117) : `listSessions` accepte déjà
   `from`/`to`, il ne manque que deux champs de date.
6. **Pagination du catalogue** (AC de SCRUM-96) : la liste est rendue d'un bloc.
7. **Test E2E du parcours de séance** (SCRUM-152) et tests d'intégration du versionnement de
   programme (SCRUM-173).

Hors pratiquant : espace coach (CDC §7) et administration (CDC §8), phases suivantes.

## Points ouverts

- Glisser-déposer des exercices (SCRUM-137) : boutons haut/bas d'abord, glisser-déposer plus tard.
- Confirmation avant suppression : alignée sur l'AC de SCRUM-101, « si des séries ont été
  saisies » — une série compte dès qu'elle a des répétitions, une charge, une note ou un statut.
  Effet de bord à surveiller : la première série d'un exercice ayant un historique est
  pré-remplie par le store, donc son retrait demande une confirmation même sans saisie réelle.
- `.claude/rules/` est référencé par `CLAUDE.md` mais n'existe pas : les règles détaillées
  (Jira, commits, Vue, CSS, données, tests) ne sont pas écrites.
- Les **sous-tâches Jira n'ont pas de description** ; les critères d'acceptation vivent dans les
  stories parentes. À relire avant d'attaquer une sous-tâche.
- `UserPreferences.autoRest` : réglable depuis le profil (SCRUM-90) **et** depuis la barre de
  repos. Deux entrées pour la même préférence, assumé.
- Le minuteur de repos ne survit pas à un rechargement de page (état en mémoire).
- Le **back** reste entièrement à faire : l'adaptateur local tient le rôle de tous les endpoints
  (`SCRUM-167`, `168`, `171`, `174`, `177`, `179`, `89`, `133`, `149`, `153`, `155`, `160`, `163`,
  `164` sont encore « À faire »).
- ECharts pèse **173 kB gzip** dans son propre lot, chargé seulement par `/progression` et
  `/design-system`. Choix assumé (SCRUM-180) ; à surveiller si d'autres écrans l'importent.
- Les filtres de date de l'adaptateur local lisent le jour dans le fuseau du **navigateur**,
  pas dans la préférence enregistrée. Sans effet en pratique (ce sont les mêmes), à corriger
  côté Supabase.
- Nom du produit : HEPHAEST (CDC) ou Hepheast (Jira).
- Compte de démo pré-rempli en dev : proposé, pas encore fait.
- Arbitrages restants : voir `decisions.md`.
- Push bloqué le 15/10 : `Permission to alexvisage/hepheast.git denied to AlexandreV-dev` (403).
  Six commits de programmes sont restés en local, à pousser après rétablissement de l'accès.
