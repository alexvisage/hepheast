# État d'avancement

Dernière mise à jour : 14/10/2026. À mettre à jour à chaque fin de session.

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
- **Tests** : polyfill `<dialog>` dans `src/__tests__/setup.ts` (jsdom n'implémente pas
  `showModal()`), déclaré en `setupFiles` de Vitest. 129 tests.

Stories laissées « En cours » car seule la partie front existe : SCRUM-51, 96, 97, 98, 100,
101, 102.
Sous-tâche laissée « En cours » : SCRUM-137, le glisser-déposer reste à faire (les boutons
monter/descendre sont en place).

## Prochaines étapes, dans l'ordre

Le parcours de séance est complet de bout en bout : démarrer, ajouter des exercices, saisir,
se reposer, terminer, voir le récapitulatif. Restent les manques repérés en relisant les
critères d'acceptation des stories :

1. **Pause et reprise de séance** (AC de SCRUM-105) : `WorkoutStatus` prévoit `paused`, mais
   ni le store ni l'UI ne l'utilisent.
2. **Historique** (SCRUM-154, 156) : « la séance apparaît immédiatement dans l'historique »
   reste à vérifier à l'écran ; les données sont déjà là (`listCompletedSessions`).
3. **Records personnels** : SCRUM-29 (définition) puis SCRUM-184 (badge en séance et dans le
   récapitulatif).
4. **SCRUM-137, reste** : glisser-déposer des exercices, en complément des boutons.
5. **Pagination du catalogue** (AC de SCRUM-96) : la liste est rendue d'un bloc.

Ensuite : tableau de bord (SCRUM-178), profil (SCRUM-90), test E2E du parcours (SCRUM-152).

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
- `UserPreferences.autoRest` ajouté au modèle pour le démarrage automatique du repos. L'écran
  de réglage des préférences reste à faire (SCRUM-90) ; en attendant, la case est dans la barre
  de repos.
- Le minuteur de repos ne survit pas à un rechargement de page (état en mémoire).
- Pages encore vides : tableau de bord, programmes, calendrier, progression, profil.
- Nom du produit : HEPHAEST (CDC) ou Hepheast (Jira).
- Compte de démo pré-rempli en dev : proposé, pas encore fait.
- Arbitrages restants : voir `decisions.md`.
