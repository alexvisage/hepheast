import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/connexion',
    name: 'login',
    component: () => import('@/domains/auth/views/LoginView.vue'),
    meta: { layout: 'auth', title: 'Connexion', public: true },
  },
  {
    path: '/inscription',
    name: 'register',
    component: () => import('@/domains/auth/views/RegisterView.vue'),
    meta: { layout: 'auth', title: 'Inscription', public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/domains/progress/views/DashboardView.vue'),
    meta: { title: 'Tableau de bord' },
  },
  {
    path: '/entrainement',
    name: 'training',
    component: () => import('@/domains/training/views/TrainingView.vue'),
    meta: { title: 'Entraînement' },
  },
  {
    path: '/entrainement/seance',
    name: 'active-session',
    component: () => import('@/domains/training/views/ActiveSessionView.vue'),
    meta: { title: 'Séance en cours', focus: true },
  },
  {
    path: '/entrainement/seance/recapitulatif',
    name: 'session-summary',
    component: () => import('@/domains/training/views/SessionSummaryView.vue'),
    meta: { title: 'Séance terminée' },
  },
  {
    path: '/programmes',
    name: 'programs',
    component: () => import('@/domains/programs/views/ProgramsView.vue'),
    meta: { title: 'Programmes' },
  },
  {
    path: '/progression',
    name: 'progress',
    component: () => import('@/domains/progress/views/ProgressView.vue'),
    meta: { title: 'Progression' },
  },
  {
    path: '/exercices',
    name: 'exercises',
    component: () => import('@/domains/exercises/views/ExercisesView.vue'),
    meta: { title: 'Exercices' },
  },
  {
    path: '/exercices/:id',
    name: 'exercise-detail',
    component: () => import('@/domains/exercises/views/ExerciseDetailView.vue'),
    props: true,
    meta: { title: 'Exercice' },
  },
  {
    path: '/calendrier',
    name: 'calendar',
    component: () => import('@/domains/calendar/views/CalendarView.vue'),
    meta: { title: 'Calendrier' },
  },
  {
    path: '/profil',
    name: 'profile',
    component: () => import('@/domains/auth/views/ProfileView.vue'),
    meta: { title: 'Profil et paramètres' },
  },
  {
    path: '/design-system',
    name: 'design-system',
    component: () => import('@/app/views/DesignSystemView.vue'),
    meta: { title: 'Design system', public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/app/views/NotFoundView.vue'),
    meta: { title: 'Page introuvable', public: true },
  },
]
