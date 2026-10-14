import { describe, expect, it } from 'vitest'

import { isActive, mobileNav, practitionerNav } from '../navigation'

const byPath = (match: string) => practitionerNav.find((item) => item.match === match)!

describe('navigation', () => {
  it("ne marque le tableau de bord actif que sur l'accueil", () => {
    expect(isActive(byPath('/'), '/')).toBe(true)
    expect(isActive(byPath('/'), '/programmes')).toBe(false)
  })

  it('garde une rubrique active sur ses sous-pages', () => {
    expect(isActive(byPath('/entrainement'), '/entrainement/seance')).toBe(true)
    expect(isActive(byPath('/exercices'), '/exercices/developpe-couche')).toBe(true)
  })

  it('limite la barre mobile à 5 entrées avec la séance au centre', () => {
    expect(mobileNav).toHaveLength(5)
    expect(mobileNav[2]?.primary).toBe(true)
  })
})
