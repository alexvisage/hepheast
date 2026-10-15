import { beforeEach, describe, expect, it } from 'vitest'

import { services } from '@/services'

/**
 * Programmes : création depuis un modèle, versionnement (CDC §6.3) et
 * cycle de vie (duplication, archivage).
 */
describe('programmes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('propose les trois modèles de départ', async () => {
    const templates = await services.programs.listTemplates()
    expect(templates.map((template) => template.id)).toEqual(['full-body', 'upper-lower', 'ppl'])
    expect(templates[0]).toMatchObject({ title: 'Full body', dayCount: 2, weekdays: [1, 3, 5] })
  })

  it('crée un programme vide en version 1', async () => {
    const program = await services.programs.createProgram({ title: 'Mon plan' })
    expect(program).toMatchObject({ title: 'Mon plan', status: 'draft', currentVersion: 1 })
    expect(program.versions).toHaveLength(1)
    expect(program.versions[0]?.days).toEqual([])
  })

  it('crée un programme depuis un modèle, avec ses jours et ses prescriptions', async () => {
    const program = await services.programs.createProgram({ title: '', templateId: 'ppl' })

    expect(program.title).toBe('Push / Pull / Legs')
    const days = program.versions[0]?.days ?? []
    expect(days.map((day) => day.name)).toEqual(['Push', 'Pull', 'Legs'])
    expect(days[0]?.exercises[0]).toMatchObject({
      exerciseId: 'bench-press',
      sets: 4,
      reps: 8,
      restSeconds: 150,
    })
    // Chaque jour et chaque exercice reçoit son propre identifiant
    const ids = days.flatMap((day) => [day.id, ...day.exercises.map((item) => item.id)])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('refuse un modèle inconnu', async () => {
    await expect(
      services.programs.createProgram({ title: 'X', templateId: 'inexistant' }),
    ).rejects.toThrow('Modèle introuvable')
  })

  it('modifie la version en place tant qu’elle n’a pas servi', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })
    const days = [{ id: 'd1', name: 'Jour 1', exercises: [] }]

    const saved = await services.programs.saveDays(created.id, days)
    expect(saved.currentVersion).toBe(1)
    expect(saved.versions).toHaveLength(1)
    expect(saved.versions[0]?.days).toEqual(days)

    const again = await services.programs.saveDays(created.id, [
      { id: 'd1', name: 'Jour renommé', exercises: [] },
    ])
    expect(again.versions).toHaveLength(1)
    expect(again.versions[0]?.days[0]?.name).toBe('Jour renommé')
  })

  it('ouvre une nouvelle version dès que la précédente a servi', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })
    await services.programs.saveDays(created.id, [{ id: 'd1', name: 'Jour 1', exercises: [] }])
    await services.programs.markVersionUsed(created.id, 1)

    const updated = await services.programs.saveDays(created.id, [
      { id: 'd1', name: 'Jour 1 revu', exercises: [] },
    ])

    expect(updated.currentVersion).toBe(2)
    expect(updated.versions).toHaveLength(2)
    // La version utilisée garde son contenu : les séances passées restent justes
    expect(updated.versions[0]?.days[0]?.name).toBe('Jour 1')
    expect(updated.versions[0]?.usedAt).toBeTruthy()
    expect(updated.versions[1]?.days[0]?.name).toBe('Jour 1 revu')
  })

  it('ne marque qu’une seule fois la version utilisée', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })
    const first = await services.programs.markVersionUsed(created.id, 1)
    const second = await services.programs.markVersionUsed(created.id, 1)
    expect(second.versions[0]?.usedAt).toBe(first.versions[0]?.usedAt)
  })

  it('duplique le contenu courant dans un brouillon neuf', async () => {
    const created = await services.programs.createProgram({
      title: 'Plan',
      templateId: 'full-body',
    })
    await services.programs.markVersionUsed(created.id, 1)
    await services.programs.setSchedule(created.id, { startDate: '2026-10-19', weekdays: [1, 3] })

    const copy = await services.programs.duplicateProgram(created.id)

    expect(copy.id).not.toBe(created.id)
    expect(copy.title).toBe('Plan (copie)')
    expect(copy.status).toBe('draft')
    expect(copy.currentVersion).toBe(1)
    expect(copy.versions).toHaveLength(1)
    expect(copy.versions[0]?.usedAt).toBeUndefined()
    expect(copy.schedule).toBeUndefined()
    expect(copy.versions[0]?.days).toHaveLength(2)
  })

  it('renomme, archive et masque les programmes archivés', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })

    const renamed = await services.programs.renameProgram(created.id, {
      title: 'Prise de masse',
      description: 'Trois mois',
    })
    expect(renamed).toMatchObject({ title: 'Prise de masse', description: 'Trois mois' })

    await services.programs.setStatus(created.id, 'archived')
    expect(await services.programs.listPrograms()).toHaveLength(0)
    expect(await services.programs.listPrograms({ includeArchived: true })).toHaveLength(1)
  })

  it('active un programme avec sa date de début et ses jours', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })
    const active = await services.programs.setSchedule(created.id, {
      startDate: '2026-10-19',
      weekdays: [1, 3, 5],
    })
    expect(active.status).toBe('active')
    expect(active.schedule).toEqual({ startDate: '2026-10-19', weekdays: [1, 3, 5] })
  })

  it('supprime un programme', async () => {
    const created = await services.programs.createProgram({ title: 'Plan' })
    await services.programs.deleteProgram(created.id)
    expect(await services.programs.listPrograms()).toHaveLength(0)
    await expect(services.programs.getProgram(created.id)).rejects.toThrow('Programme introuvable')
  })
})
