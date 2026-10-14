import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  CalendarDays,
  ChartLine,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
} from '@lucide/vue'

export interface NavItem {
  label: string
  /** Libellé court pour la barre de navigation mobile */
  shortLabel: string
  to: RouteLocationRaw
  /** Nom de route servant à marquer l'entrée active (inclut les sous-pages) */
  match: string
  icon: Component
  /** Action principale, mise en avant dans la barre mobile */
  primary?: boolean
}

/** Navigation pratiquant (CDC §3.1) */
export const practitionerNav: NavItem[] = [
  {
    label: 'Tableau de bord',
    shortLabel: 'Accueil',
    to: { name: 'dashboard' },
    match: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Programmes',
    shortLabel: 'Programmes',
    to: { name: 'programs' },
    match: '/programmes',
    icon: ClipboardList,
  },
  {
    label: 'Entraînement',
    shortLabel: 'Séance',
    to: { name: 'training' },
    match: '/entrainement',
    icon: Dumbbell,
    primary: true,
  },
  {
    label: 'Calendrier',
    shortLabel: 'Calendrier',
    to: { name: 'calendar' },
    match: '/calendrier',
    icon: CalendarDays,
  },
  {
    label: 'Progression',
    shortLabel: 'Progrès',
    to: { name: 'progress' },
    match: '/progression',
    icon: ChartLine,
  },
  {
    label: 'Exercices',
    shortLabel: 'Exercices',
    to: { name: 'exercises' },
    match: '/exercices',
    icon: ListChecks,
  },
]

/** Entrées affichées dans la barre mobile (5 maximum pour rester confortable au pouce) */
export const mobileNav = practitionerNav.filter((item) => item.match !== '/exercices')

export function isActive(item: NavItem, path: string): boolean {
  return item.match === '/' ? path === '/' : path.startsWith(item.match)
}
