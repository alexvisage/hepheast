import type { Program, ProgramDay, ProgramVersion } from '@/types/domain'

import { ServiceError, type ProgramService } from '../contracts'

import { findTemplate, programTemplates, templateDays } from './programTemplates'
import { createId, detach, latency, readJson, writeJson } from './storage'

/**
 * Programmes de démonstration, stockés dans le navigateur.
 *
 * Le versionnement suit le CDC §6.3 : tant qu'une version n'a servi à aucune
 * séance, elle se modifie en place ; dès qu'elle a servi, toute modification
 * crée une nouvelle version et l'ancienne reste consultable. Les séances
 * passées référencent leur version et ne changent donc jamais.
 */

const PROGRAMS_KEY = 'programs'

function load(): Program[] {
  return readJson<Program[]>(PROGRAMS_KEY, [])
}

function persist(programs: Program[]): void {
  writeJson(PROGRAMS_KEY, programs)
}

function currentVersionOf(program: Program): ProgramVersion | undefined {
  return program.versions.find((version) => version.version === program.currentVersion)
}

export function createLocalPrograms(getUserId: () => string | null): ProgramService {
  const userId = () => getUserId() ?? 'anonymous'
  const mine = () =>
    load()
      .filter((program) => program.userId === userId())
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))

  function save(program: Program): Program {
    const copy = detach(program)
    persist([...load().filter((item) => item.id !== program.id), copy])
    return copy
  }

  function find(id: string): Program {
    const program = mine().find((item) => item.id === id)
    if (!program) throw new ServiceError('not-found', 'Programme introuvable')
    return program
  }

  return {
    async listPrograms({ includeArchived = false } = {}) {
      await latency()
      return mine().filter((program) => includeArchived || program.status !== 'archived')
    },

    async getProgram(id) {
      await latency(60)
      return find(id)
    },

    async listTemplates() {
      await latency(40)
      return programTemplates.map(({ id, title, description, weekdays, days }) => ({
        id,
        title,
        description,
        weekdays,
        dayCount: days.length,
      }))
    },

    async createProgram({ title, description, templateId }) {
      await latency()
      const template = templateId ? findTemplate(templateId) : undefined
      if (templateId && !template) throw new ServiceError('not-found', 'Modèle introuvable')
      const now = new Date().toISOString()
      const program: Program = {
        id: createId(),
        userId: userId(),
        title: title.trim() || template?.title || 'Programme',
        ...(description?.trim() || template?.description
          ? { description: description?.trim() || template?.description }
          : {}),
        status: 'draft',
        createdAt: now,
        currentVersion: 1,
        versions: [
          {
            version: 1,
            createdAt: now,
            days: template ? templateDays(template, createId) : [],
          },
        ],
      }
      return save(program)
    },

    async renameProgram(id, { title, description }) {
      await latency()
      const program = find(id)
      return save({
        ...program,
        title: title.trim() || program.title,
        ...(description === undefined ? {} : { description: description.trim() || undefined }),
      })
    },

    async saveDays(id, days: ProgramDay[]) {
      await latency()
      const program = find(id)
      const current = currentVersionOf(program)
      // Version déjà utilisée : on en ouvre une nouvelle plutôt que de réécrire l'histoire
      if (current?.usedAt) {
        const version = program.currentVersion + 1
        return save({
          ...program,
          currentVersion: version,
          versions: [
            ...program.versions,
            { version, createdAt: new Date().toISOString(), days: detach(days) },
          ],
        })
      }
      return save({
        ...program,
        versions: program.versions.map((item) =>
          item.version === program.currentVersion ? { ...item, days: detach(days) } : item,
        ),
      })
    },

    async duplicateProgram(id) {
      await latency()
      const program = find(id)
      const now = new Date().toISOString()
      const source = currentVersionOf(program)
      // La copie repart d'une version 1 vierge d'historique
      return save({
        ...detach(program),
        id: createId(),
        title: `${program.title} (copie)`,
        status: 'draft',
        createdAt: now,
        currentVersion: 1,
        versions: [{ version: 1, createdAt: now, days: detach(source?.days ?? []) }],
        schedule: undefined,
      })
    },

    async setStatus(id, status) {
      await latency()
      return save({ ...find(id), status })
    },

    async setSchedule(id, schedule) {
      await latency()
      return save({ ...find(id), status: 'active', schedule })
    },

    async markVersionUsed(id, version) {
      await latency(40)
      const program = find(id)
      return save({
        ...program,
        versions: program.versions.map((item) =>
          item.version === version && !item.usedAt
            ? { ...item, usedAt: new Date().toISOString() }
            : item,
        ),
      })
    },

    async deleteProgram(id) {
      await latency()
      persist(load().filter((item) => !(item.id === id && item.userId === userId())))
    },
  }
}
