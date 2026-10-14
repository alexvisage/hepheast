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

Stories laissées « En cours » car seule la partie front existe : SCRUM-51, 96, 97, 98, 100.

## Prochaines étapes, dans l'ordre

1. **SCRUM-125** : dialogue « sélecteur d'exercice » (réutiliser `ExerciseSearch` en mode
   `select`) branché sur `activeSessionStore.addExercise`.
2. **SCRUM-137** : liste des exercices de la séance, ordre haut/bas
   (`moveExercise`), suppression avec `ConfirmDialog` si des séries existent.
3. **SCRUM-139** : ligne de saisie de série (`NumberStepper` répétitions et charge, statut,
   type, note). Prévoir une variante compacte du stepper pour la largeur mobile.
4. **SCRUM-140** : bouton « copier la série précédente » (`copyPreviousSet`) ; le
   pré-remplissage depuis la dernière performance existe déjà dans le store.
5. **SCRUM-142 / 143** : minuteur de repos (store dédié, démarrage auto après
   `toggleSetDone`, ±15 s, vibration, durée par défaut depuis les préférences).
6. **SCRUM-151** : écran récapitulatif de fin de séance (`summarizeSession` existe).
7. **SCRUM-141** : tests de composants de la saisie.

Ensuite : tableau de bord (SCRUM-178), historique (SCRUM-154, 156), profil (SCRUM-90).

## Points ouverts

- Glisser-déposer des exercices (SCRUM-137) : boutons haut/bas d'abord, glisser-déposer plus tard.
- Pages encore vides : tableau de bord, programmes, calendrier, progression, profil.
- Nom du produit : HEPHAEST (CDC) ou Hepheast (Jira).
- Compte de démo pré-rempli en dev : proposé, pas encore fait.
- Arbitrages restants : voir `decisions.md`.
