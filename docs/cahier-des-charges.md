# HEPHAEST — Cahier des charges

Application de musculation, de suivi de progression et de coaching. _Forge ta progression._

Document de cadrage fonctionnel, UX et technique. Version 1.0, 14 octobre 2026. Statut : base de
travail évolutive. Identité envisagée : univers de forge mythologique grecque, esthétique premium,
graphite et cuivre.

> Les arbitrages pris depuis cette version (backend, CSS, etc.) sont dans `decisions.md`, qui fait
> foi en cas de contradiction.

## 0. Synthèse exécutive

HEPHAEST est une application web moderne dédiée à la pratique de la musculation et au coaching. Elle
doit permettre à un pratiquant de planifier ses entraînements, saisir rapidement ses performances,
suivre sa progression et comprendre son évolution. Elle doit également offrir aux coachs un espace de
gestion des clients, de création de programmes et de suivi, ainsi qu'une administration globale de la
plateforme.

Le produit doit conjuguer une saisie rapide en salle, des analyses fiables, une expérience mobile
soignée et une architecture capable d'évoluer. Un même compte peut être à la fois pratiquant et coach :
l'utilisateur change de contexte sans devoir créer plusieurs comptes.

**Principe directeur** : réduire les frictions pendant l'entraînement, tout en transformant les données
saisies en informations utiles à la progression.

Périmètre de ce document : vision produit, rôles et droits, fonctionnalités, règles métier, UX/UI,
architecture technique, données, sécurité, tests et feuille de route. Les choix de backend,
d'hébergement et de monétisation restent à confirmer.

### Décisions structurantes proposées

- Frontend : Vue.js 3, TypeScript et Vite, avec une architecture par domaines fonctionnels.
- Expérience : responsive, mobile-first pour l'entraînement, plus dense sur ordinateur pour l'analyse
  et la gestion coach.
- Backend : API sécurisée et base relationnelle PostgreSQL ; Supabase est une option pragmatique pour
  démarrer.
- Données : historique des séances conservé, programmes versionnés et unités normalisées.
- Livraison : MVP centré sur le suivi personnel avant les fonctionnalités avancées coach et
  administration.

## 1. Vision, objectifs et périmètre

### 1.1 Vision

Faire de HEPHAEST un espace unique où l'on construit sa progression : chaque séance nourrit un
historique, chaque programme peut évoluer et les coachs disposent d'une vue claire de l'activité de
leurs clients.

### 1.2 Objectifs produit

- Planifier les séances dans un calendrier semaine/mois.
- Consigner les exercices, séries, répétitions, charges et notes avec un minimum d'interactions.
- Consulter l'historique par exercice, groupe musculaire, machine et période.
- Visualiser des tendances et records personnels sans présenter de métriques trompeuses.
- Créer, adapter, attribuer et faire évoluer des programmes d'entraînement.
- Permettre au coach de suivre plusieurs clients dans un espace distinct et sécurisé.
- Prévoir une administration des comptes, contenus de référence et signalements.
- Construire une base maintenable, testable, accessible et évolutive.

### 1.3 Hors périmètre initial

- Diagnostic médical, prescription ou promesse de résultat physique.
- Réseau social public complet, messagerie temps réel complexe ou place de marché de coachs.
- Intégrations natives avec toutes les montres et tous les appareils dès la première version.
- Génération automatique de programmes considérée comme substitut au jugement d'un coach.
- Application native iOS/Android dédiée si une PWA répond aux besoins du MVP.

### 1.4 Indicateurs de succès

| Indicateur            | Définition proposée                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Activation            | Part des nouveaux comptes ayant créé ou suivi un programme et enregistré une première séance. |
| Rétention             | Utilisateurs actifs à 7 et 30 jours, à segmenter par pratiquant et coach.                     |
| Adoption entraînement | Nombre de séances enregistrées par utilisateur actif et par semaine.                          |
| Qualité de saisie     | Taux de séances complètes, erreurs de synchronisation et doublons.                            |
| Valeur coach          | Clients actifs suivis, programmes attribués et retours de suivi réalisés.                     |
| Fiabilité             | Disponibilité, temps de réponse, taux d'erreurs et réussite des sauvegardes.                  |

## 2. Utilisateurs, rôles et permissions

### 2.1 Rôles

| Rôle             | Besoins et capacités                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Visiteur         | Découvrir le produit et consulter les pages publiques éventuelles.                                                              |
| Pratiquant       | Gérer son profil, ses séances, exercices favoris, programmes et statistiques personnelles.                                      |
| Coach            | Gérer ses clients autorisés, créer des programmes, attribuer des plans, consulter les données partagées et rédiger des retours. |
| Coach-pratiquant | Bénéficier des capacités pratiquant et coach sur le même compte, avec changement de contexte.                                   |
| Administrateur   | Gérer utilisateurs, rôles, catalogue, catégories, contenus, incidents et paramètres de plateforme.                              |

### 2.2 Règles d'autorisation

- Un utilisateur ne peut lire ou modifier que ses données et celles explicitement partagées avec lui.
- Un coach n'accède aux données d'un client qu'après invitation/acceptation ou attribution explicite
  d'un accès.
- La relation coach-client doit pouvoir être révoquée ; les règles de conservation après rupture
  restent à définir.
- Les actions administratives sensibles doivent être limitées, journalisées et réservées aux rôles
  habilités.
- Le changement de contexte coach/pratiquant ne doit pas modifier l'identité du compte ni contourner
  les permissions.
- Les permissions sont contrôlées côté serveur ; masquer un bouton dans l'interface ne constitue pas
  une protection.

### 2.3 Parcours de changement de contexte

Un compte cumulant les rôles dispose d'un sélecteur clair « Mon entraînement / Espace coach ».
L'interface adapte la navigation et les données affichées, conserve le contexte choisi et indique
visuellement le mode actif. Le rôle administrateur est séparé et ne doit pas être confondu avec les
modes métier ordinaires.

## 3. Architecture fonctionnelle et navigation

### 3.1 Navigation pratiquant

- Tableau de bord : prochaine séance, semaine en cours, derniers résultats, records et raccourcis.
- Entraînement : séance active, démarrer une séance, historique et modèles de séances.
- Programmes : programme actif, bibliothèque, calendrier de planification et éditeur.
- Progression : analyses globales, par exercice, muscle, équipement et période.
- Exercices : catalogue, recherche, filtres et favoris.
- Calendrier : vues jour/semaine/mois, séances prévues et séances terminées.
- Profil et paramètres : préférences, unités, confidentialité, export et compte.

### 3.2 Navigation coach

- Vue d'ensemble des clients et alertes de suivi.
- Répertoire clients avec recherche, filtres et statut de relation.
- Fiche client : objectifs déclarés, programme actif, historique partagé, progression et notes.
- Bibliothèque de programmes et modèles réutilisables.
- Éditeur de programme, attribution, dates et gestion des versions.
- Suivi des séances, commentaires et points à aborder lors du prochain bilan.

### 3.3 Administration

- Tableau de bord d'activité agrégée et d'incidents.
- Gestion des comptes, rôles, suspensions et demandes de support.
- Gestion du catalogue d'exercices, des muscles, équipements et catégories.
- Audit des actions sensibles et outils de modération.
- Configuration de paramètres globaux et surveillance technique, sans accès systématique au contenu
  privé des séances.

## 4. Fonctionnalités détaillées — pratiquant

### 4.1 Tableau de bord personnel

- Afficher la prochaine séance prévue et un accès direct à « Démarrer ».
- Résumer le volume récent, la fréquence d'entraînement et les records récents.
- Présenter des graphiques de progression sur des périodes configurables.
- Permettre de reprendre une séance en cours après interruption.
- Proposer des raccourcis vers le dernier entraînement, les favoris et le calendrier.
- Expliquer les indicateurs et afficher un état vide utile lorsque l'historique est insuffisant.

### 4.2 Séance active et saisie rapide

La séance active est le parcours prioritaire du MVP. L'écran doit rester lisible en salle, avec de
grandes zones tactiles et peu de navigation. Les données doivent être sauvegardées régulièrement afin
de limiter la perte de saisie.

- Démarrer depuis un programme, un modèle, une séance planifiée ou une séance vierge.
- Ajouter, supprimer et réordonner les exercices ; retrouver rapidement les exercices favoris.
- Pour chaque exercice, afficher les séries prévues et les dernières performances connues.
- Saisir pour chaque série : numéro, répétitions, charge, statut (prévue, réalisée, ignorée) et note
  facultative.
- Prévoir des types de séries configurables : échauffement, travail, dégressive ou autre catégorie
  extensible.
- Permettre de copier les valeurs de la série précédente et de réutiliser la dernière charge connue.
- Ajouter une durée de repos avec minuteur manuel et/ou automatique en option.
- Enregistrer la durée totale, la date, les notes de séance et le ressenti facultatif.
- Mettre en évidence les records personnels, sans interrompre la saisie.
- Mettre en pause, reprendre, terminer ou abandonner avec confirmation lorsque des données risquent
  d'être perdues.
- Afficher un récapitulatif de fin de séance : exercices, séries, répétitions, volume calculé et
  records éventuels.

### 4.3 Historique

- Liste chronologique avec date, durée, programme et état de la séance.
- Filtres par période, exercice, muscle, programme et équipement.
- Ouverture d'une séance pour revoir précisément les séries enregistrées.
- Possibilité de corriger une erreur avec traçabilité minimale de la modification.
- Duplication d'une séance antérieure comme point de départ, sans écraser l'original.

### 4.4 Catalogue d'exercices

- Recherche textuelle et filtres par groupe musculaire, équipement, type de mouvement et favoris.
- Fiche exercice : nom, description, consignes, équipement, muscles principaux et secondaires.
- Alias et variantes pour limiter les doublons, avec possibilité d'exercices personnalisés.
- Relations entre exercice et équipement/muscles conservées de façon structurée.
- Possibilité de masquer les exercices inutilisés ou de créer une bibliothèque personnelle.
- Images/vidéos explicatives à ajouter progressivement, avec droits d'utilisation vérifiés.

### 4.5 Calendrier

- Vues mois, semaine et jour, avec navigation vers les périodes précédentes/suivantes.
- Différencier visuellement séances planifiées, terminées, manquées et déplacées.
- Créer, déplacer ou annuler une séance planifiée.
- Accéder à une séance passée ou démarrer la séance du jour depuis le calendrier.
- Afficher un résumé hebdomadaire de la fréquence et de la régularité.
- Respecter fuseau horaire, changement de date et préférences de début de semaine.

## 5. Progression et analyses

### 5.1 Principes

Les statistiques doivent être compréhensibles, cohérentes et calculées à partir de données clairement
définies. Une valeur estimée doit être identifiée comme telle ; elle ne doit pas être confondue avec
une performance réellement effectuée.

### 5.2 Analyses par exercice

- Historique des charges, répétitions et séries sur une période sélectionnée.
- Graphiques par séance et par date ; sélection d'une série ou d'un meilleur résultat lorsque
  pertinent.
- Records personnels : charge maximale réalisée, répétitions à une charge donnée et meilleur volume,
  avec définitions explicites.
- Volume par séance : somme charge × répétitions pour les séries de travail renseignées, si
  l'exercice utilise une charge mesurable.
- Éventuelle estimation de 1RM, clairement signalée comme estimation et utilisant une formule
  documentée.
- Comparaison de deux périodes ou de deux séances lorsque les données sont comparables.

### 5.3 Analyses par muscle, équipement et programme

- Volume et fréquence par groupe musculaire, calculés à partir des associations configurées.
- Historique d'utilisation des machines et équipements.
- Tendances par programme ou bloc d'entraînement.
- Répartition des exercices et de la charge d'entraînement au fil du temps.
- Indiquer les limites des calculs : un exercice peut solliciter plusieurs muscles et les
  pondérations ne sont pas une mesure physiologique exacte.

### 5.4 Filtres et visualisation

- Périodes : 7 jours, 30 jours, 90 jours, année et intervalle personnalisé.
- Filtrage par exercice, groupe musculaire, programme et équipement.
- Graphiques accessibles, légendes explicites et alternatives textuelles.
- Unités visibles, axes cohérents et absence de comparaison trompeuse entre données non équivalentes.
- États sans données, chargement et erreur traités proprement.

## 6. Programmes et planification

### 6.1 Création de programme

- Créer un programme à partir de zéro ou d'un modèle.
- Organiser le programme en jours/séances, exercices et prescriptions de séries/répétitions.
- Paramétrer repos, charge cible facultative, consignes, tempo et notes.
- Prendre en charge plusieurs structures : full body, upper/lower, PPL, split personnalisé ou routine
  libre.
- Réordonner les séances et les exercices par glisser-déposer avec alternative clavier.
- Dupliquer, archiver et renommer un programme.

### 6.2 Affectation et progression

- Définir une date de début, une fréquence ou des jours de référence.
- Planifier les séances au calendrier et permettre leur déplacement.
- Proposer une progression de charge/répétitions configurable, sans appliquer automatiquement une
  hausse non confirmée.
- Distinguer la prescription du programme de la performance réellement enregistrée.
- Autoriser une adaptation individuelle sans modifier le modèle d'origine.
- Conserver les anciennes versions d'un programme pour comprendre l'historique.

### 6.3 Versionnement

Lorsqu'un programme utilisé est modifié, l'application doit préciser si la modification affecte
seulement les prochaines séances ou crée une nouvelle version. Les séances passées doivent conserver
une représentation fidèle de ce qui était prévu au moment où elles ont été réalisées.

## 7. Espace coach

### 7.1 Gestion des clients

- Inviter un client via un mécanisme sécurisé et explicite d'acceptation.
- Consulter la liste des clients, leur statut, la date du dernier entraînement et le programme actif.
- Rechercher, filtrer, archiver et réactiver une relation client selon les règles de conservation.
- Afficher les objectifs déclarés par le client et les informations qu'il a choisi de partager.
- Permettre la révocation de l'accès et expliquer ses conséquences.

### 7.2 Fiche client

- Résumé des dernières séances et de la régularité.
- Historique des exercices et indicateurs partagés.
- Programme actif, calendrier et changements récents.
- Notes privées du coach clairement séparées des notes visibles par le client.
- Commentaires sur une séance ou un programme, avec date et auteur.
- Repères de suivi et objectifs définis avec le client.

### 7.3 Création et attribution

- Créer des modèles réutilisables et les dupliquer pour un client.
- Attribuer un programme avec dates, consignes et personnalisation.
- Réviser le programme sans altérer les séances historiques.
- Suivre si le programme a été consulté ou si des séances ont été enregistrées, si cette
  fonctionnalité est activée.
- Prévoir une vue coach synthétique et des filtres par client, période et programme.

### 7.4 Communication et limites

Pour le MVP, des commentaires structurés liés aux séances peuvent suffire. Une messagerie complète,
les notifications push et les échanges de fichiers pourront être ajoutés après validation des besoins.
L'application doit éviter de présenter le coach comme un professionnel de santé sauf si le contexte
réglementaire et les qualifications sont établis.

## 8. Administration et exploitation

- Gestion des comptes, rôles et statuts avec confirmation pour les actions sensibles.
- Gestion du catalogue d'exercices, groupes musculaires, équipements et taxonomies.
- Journal d'audit pour les changements de rôle, suspensions, suppressions et opérations
  administratives.
- Outils de diagnostic : erreurs applicatives, synchronisation, tâches échouées et état des
  sauvegardes.
- Gestion des demandes de support et des signalements.
- Indicateurs agrégés minimisant l'exposition de données personnelles.
- Possibilité de désactiver un compte ou un contenu selon une procédure documentée.

## 9. Exigences UX/UI et identité HEPHAEST

### 9.1 Direction artistique

Positionnement proposé : premium, précis et contemporain. L'univers de la forge grecque doit rester
subtil : éviter l'esthétique fantasy trop chargée, les textures métalliques excessives et les clichés
de culturisme.

| Élément       | Direction proposée                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Couleurs      | Graphite/noir charbon, cuivre comme accent, tons neutres pour les surfaces et états.                                |
| Logo          | Monogramme géométrique inspiré d'un H, d'un marteau et/ou d'une enclume ; version symbole seul pour favicon et app. |
| Typographie   | Sans-serif moderne et lisible ; titres plus affirmés, chiffres tabulaires pour les performances.                    |
| Composants    | Cartes sobres, hiérarchie nette, graphiques lisibles, boutons tactiles et formulaires courts.                       |
| Ton éditorial | Précis, motivant sans culpabiliser, centré sur la progression et la constance.                                      |
| Slogan        | « Forge ta progression. » / « Forge your progress. »                                                                |

### 9.2 Responsive et accessibilité

- Mobile-first pour l'écran de séance ; navigation plus dense et tableaux détaillés sur grand écran.
- Cibles tactiles confortables, états de focus visibles et navigation clavier.
- Contrastes suffisants, textes redimensionnables et libellés explicites.
- Ne jamais transmettre une information uniquement par la couleur.
- Respecter les préférences de réduction des animations.
- Viser les critères WCAG 2.2 niveau AA comme cible de conception et de test.

### 9.3 États et retours utilisateur

- États chargement, vide, succès, erreur, hors ligne et sauvegarde en attente.
- Confirmation claire de fin de séance et de suppression.
- Retour non bloquant après une action courante ; confirmation avant les actions destructrices.
- Préserver la saisie lors d'une erreur réseau et proposer une reprise.

## 10. Exigences techniques

### 10.1 Frontend

| Brique          | Choix proposé                        | Rôle                                                           |
| --------------- | ------------------------------------ | -------------------------------------------------------------- |
| Framework       | Vue.js 3 + Composition API           | Interface modulaire et composants réutilisables.               |
| Langage / build | TypeScript + Vite                    | Typage et cycle de développement rapide.                       |
| Navigation      | Vue Router                           | Routes, protections et layouts par contexte.                   |
| État            | Pinia                                | État partagé limité aux besoins transverses.                   |
| Style           | Tailwind CSS ou système CSS cohérent | Responsive et cohérence visuelle. _(Décision : CSS classique)_ |
| Graphiques      | ECharts ou Chart.js                  | Visualisations de progression.                                 |
| Validation      | Zod ou équivalent                    | Validation des entrées côté client, en complément du serveur.  |
| Tests           | Vitest, Vue Test Utils, Playwright   | Tests unitaires, composants et parcours end-to-end.            |

### 10.2 Backend et infrastructure

Option recommandée pour démarrer : PostgreSQL avec Supabase (authentification, base et stockage si
nécessaire), en conservant une couche d'accès aux données bien isolée. Alternative : API
Node.js/TypeScript avec framework adapté et PostgreSQL géré. Le choix final dépendra des exigences de
sécurité, du budget, des compétences disponibles et de la trajectoire du produit. _(Décision :
Supabase, plan gratuit.)_

- Authentification fiable, gestion de sessions et procédure de récupération de compte.
- API documentée et validation serveur systématique.
- Contrôle d'accès au niveau des ressources et des relations coach-client.
- Environnements distincts : développement, test/staging et production.
- Secrets uniquement côté serveur ; aucune clé privée dans le bundle frontend.
- Sauvegardes automatiques, tests de restauration et supervision.
- Journalisation utile sans consigner inutilement des données sensibles.

### 10.3 Structure de code indicative

```
src/
  app/          # initialisation, routes, layouts
  components/   # composants UI partagés
  domains/
    auth/ training/ exercises/ programs/
    progress/ calendar/ coaching/ admin/
  services/     # API, validation, utilitaires
  stores/       # état Pinia si nécessaire
  types/
tests/
```

### 10.4 Qualité et conventions

- Activer TypeScript strict et un formatage/linting automatisé.
- Définir des conventions de nommage, gestion des erreurs et découpage des composants.
- Éviter la logique métier dans les composants de présentation.
- Documenter les calculs de statistiques et les décisions de sécurité.
- Automatiser les tests et contrôles essentiels dans la chaîne d'intégration continue.

## 11. Modèle de données conceptuel

Le modèle ci-dessous est conceptuel. Les noms et cardinalités exacts seront validés lors de la
conception détaillée. Les identifiants devraient être stables ; les dates stockées avec une référence
temporelle cohérente ; les unités normalisées ou explicitement enregistrées.

| Entité                       | Champs principaux / rôle                                                        |
| ---------------------------- | ------------------------------------------------------------------------------- |
| User                         | id, email, nom affiché, préférences, statut, dates de création.                 |
| Role / UserRole              | rôles attribués et permissions effectives.                                      |
| Exercise                     | id, nom, description, type, équipement, statut, créateur éventuel.              |
| MuscleGroup                  | id, nom, catégorie ; association ExerciseMuscle avec rôle principal/secondaire. |
| Equipment                    | id, nom, catégorie.                                                             |
| Program                      | id, propriétaire, titre, description, statut.                                   |
| ProgramVersion               | program_id, numéro/version, prescriptions, dates d'effet.                       |
| ProgramDay / ProgramExercise | structure ordonnée des séances et exercices prescrits.                          |
| ScheduledWorkout             | utilisateur, programme/version, date prévue, statut.                            |
| WorkoutSession               | utilisateur, date début/fin, état, notes, programme/version de référence.       |
| WorkoutExercise              | séance, exercice, ordre, notes et données de contexte.                          |
| SetEntry                     | exercice de séance, numéro, répétitions, charge, unité, statut, repos et note.  |
| PersonalRecord               | utilisateur, exercice, type de record, valeur, date et provenance.              |
| CoachClientRelationship      | coach, client, statut, dates d'autorisation et révocation.                      |
| CoachNote / Feedback         | auteur, destinataire, objet lié, visibilité, contenu et horodatage.             |
| AuditLog                     | acteur, action, ressource, horodatage et métadonnées minimisées.                |

### 11.1 Relations et règles de cohérence

- Une séance appartient à un pratiquant ; elle contient un ou plusieurs exercices de séance.
- Un exercice de séance peut contenir plusieurs entrées de séries.
- Un programme possède des versions ; une séance terminée référence la version utilisée.
- Les associations muscles/exercices doivent être maintenues dans le catalogue et versionnées si
  l'analyse historique l'exige.
- Les charges doivent stocker une valeur numérique et une unité explicite ; les conversions doivent
  être cohérentes.
- Les records peuvent être recalculés à partir des séries sources ; leur cache ne doit pas devenir la
  seule source de vérité.
- Les suppressions de données liées doivent suivre une politique explicite : cascade contrôlée,
  archivage ou anonymisation.

## 12. API — principes et exemples

Les routes suivantes sont illustratives, pas une spécification contractuelle finale. Les formats,
codes d'erreur et mécanismes de pagination devront être documentés avant le développement.

| Méthode / route indicative          | Usage                                           |
| ----------------------------------- | ----------------------------------------------- |
| `GET /me`                           | Profil et préférences de l'utilisateur courant. |
| `GET /exercises?query=&muscle=`     | Recherche et filtres du catalogue.              |
| `GET /programs`                     | Lister les programmes accessibles.              |
| `POST /programs`                    | Créer un programme.                             |
| `POST /workout-sessions`            | Démarrer une séance.                            |
| `POST /workout-sessions/{id}/sets`  | Enregistrer une série.                          |
| `PATCH /workout-sessions/{id}`      | Mettre à jour ou terminer une séance.           |
| `GET /progress/exercises/{id}`      | Historique et métriques d'un exercice.          |
| `GET /calendar?from=&to=`           | Séances prévues et terminées sur une période.   |
| `GET /coach/clients`                | Lister les clients du coach connecté.           |
| `POST /coach/clients/invitations`   | Créer une invitation coach-client.              |
| `POST /coach/clients/{id}/programs` | Attribuer un programme à un client.             |

### 12.1 Exigences API

- Authentification et autorisation sur chaque endpoint privé.
- Validation des paramètres et du corps de requête côté serveur.
- Pagination, filtres bornés et tri explicite pour les listes.
- Erreurs structurées et messages qui n'exposent pas d'informations sensibles.
- Protection contre les doublons lors des nouvelles tentatives de sauvegarde.
- Versionnement des endpoints si des changements incompatibles deviennent nécessaires.

## 13. Sécurité, confidentialité et conformité

- Collecter uniquement les données nécessaires au fonctionnement du service.
- Informer clairement sur les finalités, la durée de conservation et les droits de l'utilisateur.
- Prévoir export et suppression du compte/données conformément aux obligations applicables.
- Appliquer le RGPD lorsque le produit cible des personnes dans l'Union européenne : base légale,
  transparence, minimisation et gestion des demandes.
- Ne pas collecter de données de santé sensibles sans nécessité, base légale et mesures adaptées ; les
  objectifs et notes d'entraînement doivent être cadrés.
- Protéger les données en transit et au repos selon les capacités de l'infrastructure retenue.
- Appliquer le principe du moindre privilège, limiter les accès administratifs et journaliser les
  opérations sensibles.
- Prévoir des sauvegardes chiffrées, une politique de rétention et des exercices de restauration.
- Ne jamais exposer les données d'un client à un coach non autorisé, même par erreur de filtre ou de
  cache.
- Définir une procédure de réponse aux incidents et de notification si requise.

> Ce cahier des charges constitue une base produit/technique et ne remplace pas une validation
> juridique, notamment pour les données personnelles, les conditions d'utilisation et les
> responsabilités liées au coaching.

## 14. Performance, fiabilité et mode dégradé

- La navigation courante doit rester fluide sur un smartphone récent et une connexion moyenne.
- Limiter les requêtes répétitives et charger les historiques volumineux progressivement.
- Prévoir la sauvegarde fréquente de la séance active et un indicateur de statut de synchronisation.
- En cas de réseau indisponible, conserver temporairement la saisie locale si une stratégie hors ligne
  est retenue.
- Éviter les conflits lors de la reprise sur plusieurs appareils ; définir une règle de résolution
  claire.
- Surveiller les erreurs frontend/backend, la latence et les échecs de sauvegarde.
- Définir des objectifs de disponibilité et de reprise après incident avant la mise en production.

## 15. Tests et critères d'acceptation

### 15.1 Tests attendus

- Tests unitaires des calculs de volume, records, conversions d'unités et agrégations.
- Tests de composants pour formulaires, séries, filtres, états vides et erreurs.
- Tests d'intégration pour sauvegarde de séance, versionnement de programme et autorisations.
- Tests end-to-end des parcours pratiquant, coach-pratiquant et administrateur.
- Tests de sécurité des accès croisés entre utilisateurs et clients.
- Tests responsive et d'accessibilité sur les écrans prioritaires.
- Tests de charge ciblés sur les historiques, graphiques et listes coach.

### 15.2 Critères d'acceptation MVP

| ID    | Critère                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------- |
| AC-01 | Un pratiquant peut créer un compte, se connecter et modifier ses préférences.                         |
| AC-02 | Un pratiquant peut créer une séance, ajouter des exercices et saisir plusieurs séries.                |
| AC-03 | Une séance interrompue peut être reprise sans perte des données déjà sauvegardées.                    |
| AC-04 | Une séance terminée apparaît dans l'historique avec ses détails exacts.                               |
| AC-05 | La fiche d'un exercice affiche l'historique des performances et un graphique cohérent.                |
| AC-06 | Le calendrier permet de planifier et consulter des séances.                                           |
| AC-07 | Un programme peut être créé, modifié, dupliqué et utilisé pour démarrer une séance.                   |
| AC-08 | Un coach peut inviter un client et lui attribuer un programme après autorisation.                     |
| AC-09 | Un coach ne peut pas consulter les données d'un client sans relation autorisée.                       |
| AC-10 | Un compte coach-pratiquant peut changer de contexte sans créer un deuxième compte.                    |
| AC-11 | Les principales vues sont utilisables sur mobile et au clavier.                                       |
| AC-12 | Les erreurs réseau et de validation sont compréhensibles et n'effacent pas silencieusement la saisie. |

## 16. Feuille de route proposée

| Phase              | Contenu                                                                                    | Livrable attendu                              |
| ------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 0 — Cadrage        | Décisions produit, parcours, maquettes, modèle de données, règles d'accès.                 | Spécification validée et prototype UX.        |
| 1 — Fondations     | Projet Vue/TS/Vite, design system, authentification, base, CI et tests.                    | Socle technique sécurisé.                     |
| 2 — MVP pratiquant | Catalogue, séance active, historique, calendrier, programmes simples, progression de base. | Boucle complète de suivi personnel.           |
| 3 — Coach          | Relations coach-client, invitations, fiche client, attribution de programme, retours.      | Première version coaching.                    |
| 4 — Administration | Gestion du catalogue/comptes, audit, support et supervision.                               | Outils d'exploitation.                        |
| 5 — Consolidation  | Mode hors ligne ciblé, notifications, analyses avancées, exports et intégrations.          | Amélioration fiabilité et profondeur produit. |

### 16.1 Priorisation

- **P0 — indispensable** : authentification, rôles de base, catalogue, séance active, séries,
  sauvegarde, historique, programmes simples, calendrier et graphiques essentiels.
- **P1 — valeur forte** : espace coach, invitation client, attribution de programmes, versionnement,
  records personnels, filtres avancés et export.
- **P2 — évolutions** : synchronisation hors ligne avancée, notifications, intégrations d'appareils,
  rapports détaillés, modèles partagés et automatisations.

### 16.2 Risques principaux

- Périmètre trop large dès le départ : protéger un MVP centré sur la boucle entraînement → historique
  → progression.
- Statistiques ambiguës : définir les formules et limites avant de développer les graphiques.
- Complexité des droits coach-client : modéliser les autorisations dès le début et les tester
  explicitement.
- Perte de données pendant une séance : sauvegardes fréquentes, reprise et tests de panne réseau.
- Catalogue incohérent : prévoir les alias, variantes et règles de dédoublonnage.
- Confusion entre programme prescrit et séance réellement exécutée : conserver les deux séparément.

## 17. Points à arbitrer avant le développement

_État des arbitrages : voir `decisions.md`._

| Sujet           | Question à trancher                                                              |
| --------------- | -------------------------------------------------------------------------------- |
| Backend         | Supabase/PostgreSQL ou API Node.js dédiée ?                                      |
| Comptes         | Inscription libre, invitations, ou combinaison des deux ?                        |
| Offre           | Gratuit, abonnement, offre coach payante, ou modèle à définir plus tard ?        |
| Plateformes     | Application web responsive/PWA uniquement au départ ?                            |
| Mode hors ligne | Simple sauvegarde de reprise ou saisie complète sans connexion ?                 |
| Catalogue       | Catalogue initial maison, import sous licence, ou saisie communautaire modérée ? |
| Unités          | Kilogrammes uniquement au départ ou prise en charge kg/lb ?                      |
| Partage coach   | Quelles données sont visibles, par défaut et avec quel consentement ?            |
| Notifications   | Email, notifications web ou aucune notification dans le MVP ?                    |
| Hébergement     | Région, budget, exigences de disponibilité et sauvegarde ?                       |

## 18. Glossaire

| Terme                | Définition                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Séance               | Entraînement effectivement démarré et consigné par un pratiquant.                        |
| Programme            | Plan de travail composé de séances, exercices et prescriptions.                          |
| Version de programme | État déterminé d'un programme à une période donnée.                                      |
| Série                | Unité de travail d'un exercice, avec répétitions et charge si applicable.                |
| Volume               | Indicateur calculé, par exemple charge × répétitions ; sa définition doit être affichée. |
| Record personnel     | Meilleure performance connue selon une règle explicitement définie.                      |
| PWA                  | Application web pouvant proposer des capacités proches d'une application installée.      |
| RBAC                 | Contrôle d'accès fondé sur les rôles, complété par des règles de ressources.             |

## 19. Conclusion

HEPHAEST doit être construit autour d'une expérience d'entraînement fiable et rapide, puis enrichi par
des analyses pertinentes et un espace coach sécurisé. La priorité n'est pas d'accumuler des
fonctionnalités, mais de garantir que chaque séance est simple à enregistrer, facile à retrouver et
réellement utile pour comprendre la progression.

La prochaine étape recommandée est de valider les arbitrages de la section 17, puis de produire les
maquettes des écrans clés et le schéma de données détaillé avant de commencer l'implémentation.
