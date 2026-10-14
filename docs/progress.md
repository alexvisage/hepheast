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
- **Séance active, saisie** (SCRUM-125, 139, 140) : sélecteur d'exercice en surcouche
  (`ExercisePickerDialog`, réutilisable en programme), liste d'exercices avec ordre et retrait,
  ligne de saisie de série (répétitions, charge, statut, type, note), copie de la série
  précédente. Variante compacte `size="sm"` du `NumberStepper`.
- **Tests** : polyfill `<dialog>` dans `src/__tests__/setup.ts` (jsdom n'implémente pas
  `showModal()`), déclaré en `setupFiles` de Vitest.

Stories laissées « En cours » car seule la partie front existe : SCRUM-51, 96, 97, 98, 100.
Sous-tâche laissée « En cours » : SCRUM-137, le glisser-déposer reste à faire (les boutons
monter/descendre sont en place).

## Prochaines étapes, dans l'ordre

1. **SCRUM-142 / 143** : minuteur de repos (store dédié, démarrage auto après
   `toggleSetDone`, ±15 s, vibration, durée par défaut depuis les préférences).
2. **SCRUM-151** : écran récapitulatif de fin de séance (`summarizeSession` existe).
3. **SCRUM-141** : tests de composants de la saisie (valeurs limites, erreurs,
   `SessionSetList` qui n'est couvert qu'indirectement pour l'instant).
4. **SCRUM-137, reste** : glisser-déposer des exercices, en complément des boutons.

Ensuite : tableau de bord (SCRUM-178), historique (SCRUM-154, 156), profil (SCRUM-90).

## Points ouverts

- Glisser-déposer des exercices (SCRUM-137) : boutons haut/bas d'abord, glisser-déposer plus tard.
- Critère de confirmation avant suppression : retenu « au moins une série validée »
  (`status === 'done'`). Une série seulement pré-remplie, donc non validée, part sans question —
  sinon tout exercice ayant un historique déclencherait une confirmation.
- `.claude/rules/` est référencé par `CLAUDE.md` mais n'existe pas : les règles détaillées
  (Jira, commits, Vue, CSS, données, tests) ne sont pas écrites.
- Pages encore vides : tableau de bord, programmes, calendrier, progression, profil.
- Nom du produit : HEPHAEST (CDC) ou Hepheast (Jira).
- Compte de démo pré-rempli en dev : proposé, pas encore fait.
- Arbitrages restants : voir `decisions.md`.
