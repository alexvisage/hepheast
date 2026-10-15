import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { SyncState } from '@/components/ui/SyncStatus.vue'
import { prescribedSets, toPrescription } from '@/domains/programs/prescription'
import { services } from '@/services'
import { createId } from '@/services/local/storage'
import { useSessionStore } from '@/stores/session'
import type {
  Exercise,
  Id,
  LastPerformance,
  Program,
  ProgramDay,
  SetEntry,
  WorkoutExercise,
  WorkoutSession,
} from '@/types/domain'

const SAVE_DELAY_MS = 400

/**
 * Séance en cours : saisie, sauvegarde continue et reprise (CDC §4.2, AC-02, AC-03).
 * Chaque modification planifie une sauvegarde ; la saisie n'est jamais perdue
 * silencieusement, l'état de synchronisation est toujours visible.
 */
export const useActiveSessionStore = defineStore('active-session', () => {
  const session = ref<WorkoutSession | null>(null)
  const exercises = ref<Record<Id, Exercise>>({})
  const lastPerformances = ref<Record<Id, LastPerformance | null>>({})
  const sync = ref<SyncState>('saved')
  const loaded = ref(false)

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let listening = false

  const hasSession = computed(() => session.value !== null)

  // --- Chargement --------------------------------------------------------

  async function hydrate(target: WorkoutSession) {
    const ids = [...new Set(target.exercises.map((item) => item.exerciseId))]
    await Promise.all(ids.map(loadExerciseContext))
  }

  async function loadExerciseContext(exerciseId: Id) {
    if (!exercises.value[exerciseId]) {
      exercises.value[exerciseId] = await services.exercises.getExercise(exerciseId)
    }
    if (!(exerciseId in lastPerformances.value)) {
      lastPerformances.value[exerciseId] = await services.workouts.getLastPerformance(exerciseId)
    }
  }

  async function load() {
    listenToNetwork()
    const active = await services.workouts.getActiveSession()
    if (active) await hydrate(active)
    session.value = active
    loaded.value = true
  }

  async function start(title = 'Séance libre') {
    listenToNetwork()
    session.value = await services.workouts.startSession({ title })
    await hydrate(session.value)
    sync.value = 'saved'
    return session.value
  }

  /**
   * Démarre la séance d'un jour de programme : exercices et séries prévues
   * sont pré-remplis, la prescription est figée à côté de la performance
   * (CDC §6.2). Aucune charge n'est augmentée automatiquement.
   */
  async function startFromProgram(program: Program, day: ProgramDay) {
    // Une séance en cours est reprise telle quelle : on n'écrase jamais une saisie,
    // y compris celle qui n'est pas encore partie en sauvegarde
    if (session.value) return session.value

    const started = await start(day.name)
    if (started.exercises.length > 0) return started

    started.programId = program.id
    started.programVersion = program.currentVersion
    started.programDayId = day.id

    const unit = useSessionStore().preferences?.unit ?? 'kg'
    for (const prescribed of day.exercises) {
      await loadExerciseContext(prescribed.exerciseId)
      const prescription = toPrescription(prescribed)
      started.exercises.push({
        id: createId(),
        exerciseId: prescribed.exerciseId,
        prescription,
        sets: prescribedSets(prescription, createId, unit),
      })
    }

    // La version devient intouchable : les prochaines modifications en créeront une autre
    await services.programs.markVersionUsed(program.id, program.currentVersion)
    scheduleSave()
    return started
  }

  /**
   * Démarre une séance planifiée, en reprenant son jour de programme quand
   * elle en vient, et la rattache à son créneau.
   */
  async function startFromScheduled(scheduled: {
    id: Id
    title: string
    programId?: Id
    programDayId?: Id
  }) {
    let started: WorkoutSession | null = null

    if (scheduled.programId && scheduled.programDayId) {
      const program = await services.programs.getProgram(scheduled.programId)
      const day = program.versions
        .find((version) => version.version === program.currentVersion)
        ?.days.find((item) => item.id === scheduled.programDayId)
      if (day) started = await startFromProgram(program, day)
    }

    started ??= await start(scheduled.title)
    await services.schedule.linkSession(scheduled.id, started.id)
    return started
  }

  // --- Sauvegarde --------------------------------------------------------

  function listenToNetwork() {
    if (listening || typeof window === 'undefined') return
    listening = true
    window.addEventListener('online', () => {
      if (sync.value === 'offline' || sync.value === 'error') void flush()
    })
    window.addEventListener('offline', () => {
      if (sync.value === 'pending') sync.value = 'offline'
    })
  }

  function scheduleSave() {
    sync.value = 'pending'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void flush(), SAVE_DELAY_MS)
  }

  async function flush() {
    clearTimeout(saveTimer)
    if (!session.value) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      sync.value = 'offline'
      return
    }
    // Copie détachée de la réactivité Vue (structuredClone refuse les proxys)
    const snapshot: WorkoutSession = JSON.parse(JSON.stringify(session.value))
    try {
      await services.workouts.saveSession(snapshot)
      // Une modification arrivée pendant l'envoi garde l'état « en attente »
      if (sync.value === 'pending' && JSON.stringify(session.value) !== JSON.stringify(snapshot)) {
        scheduleSave()
      } else {
        sync.value = 'saved'
      }
    } catch {
      sync.value = 'error'
    }
  }

  // --- Exercices ---------------------------------------------------------

  function findExercise(workoutExerciseId: Id): WorkoutExercise | undefined {
    return session.value?.exercises.find((item) => item.id === workoutExerciseId)
  }

  function emptySet(previous?: Pick<SetEntry, 'reps' | 'load' | 'unit' | 'kind'>): SetEntry {
    const unit = useSessionStore().preferences?.unit ?? 'kg'
    return {
      id: createId(),
      kind: previous?.kind === 'warmup' ? 'working' : (previous?.kind ?? 'working'),
      status: 'planned',
      reps: previous?.reps ?? null,
      load: previous?.load ?? null,
      unit: previous?.unit ?? unit,
    }
  }

  async function addExercise(exercise: Exercise) {
    if (!session.value) return
    exercises.value[exercise.id] = exercise
    await loadExerciseContext(exercise.id)
    // Première série pré-remplie avec la dernière performance de travail connue
    const last = lastPerformances.value[exercise.id]
    const reference = last?.sets.find((set) => set.kind === 'working') ?? last?.sets[0]
    const entry: WorkoutExercise = {
      id: createId(),
      exerciseId: exercise.id,
      sets: [emptySet(reference)],
    }
    session.value.exercises.push(entry)
    scheduleSave()
    return entry
  }

  function removeExercise(workoutExerciseId: Id) {
    if (!session.value) return
    session.value.exercises = session.value.exercises.filter(
      (item) => item.id !== workoutExerciseId,
    )
    scheduleSave()
  }

  function moveExercise(workoutExerciseId: Id, direction: -1 | 1) {
    const list = session.value?.exercises
    if (!list) return
    const index = list.findIndex((item) => item.id === workoutExerciseId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return
    const [moved] = list.splice(index, 1)
    if (moved) list.splice(target, 0, moved)
    scheduleSave()
  }

  // --- Séries ------------------------------------------------------------

  /** Ajoute une série qui reprend les valeurs de la précédente */
  function addSet(workoutExerciseId: Id) {
    const entry = findExercise(workoutExerciseId)
    if (!entry) return
    entry.sets.push(emptySet(entry.sets.at(-1)))
    scheduleSave()
  }

  function updateSet(workoutExerciseId: Id, setId: Id, patch: Partial<SetEntry>) {
    const set = findExercise(workoutExerciseId)?.sets.find((item) => item.id === setId)
    if (!set) return
    Object.assign(set, patch)
    scheduleSave()
  }

  /** Copie répétitions et charge de la série précédente */
  function copyPreviousSet(workoutExerciseId: Id, setId: Id) {
    const sets = findExercise(workoutExerciseId)?.sets
    const index = sets?.findIndex((item) => item.id === setId) ?? -1
    const previous = index > 0 ? sets?.[index - 1] : undefined
    if (!previous) return
    updateSet(workoutExerciseId, setId, {
      reps: previous.reps,
      load: previous.load,
      unit: previous.unit,
    })
  }

  /** Valide ou dévalide une série ; retourne true si elle vient d'être validée */
  function toggleSetDone(workoutExerciseId: Id, setId: Id): boolean {
    const set = findExercise(workoutExerciseId)?.sets.find((item) => item.id === setId)
    if (!set) return false
    const done = set.status !== 'done'
    updateSet(workoutExerciseId, setId, {
      status: done ? 'done' : 'planned',
      completedAt: done ? new Date().toISOString() : undefined,
    })
    return done
  }

  function removeSet(workoutExerciseId: Id, setId: Id) {
    const entry = findExercise(workoutExerciseId)
    if (!entry) return
    entry.sets = entry.sets.filter((item) => item.id !== setId)
    scheduleSave()
  }

  // --- Fin de séance -----------------------------------------------------

  async function finish(details: Pick<WorkoutSession, 'note' | 'feeling'> = {}) {
    if (!session.value) return null
    const completed: WorkoutSession = {
      ...session.value,
      ...details,
      status: 'completed',
      endedAt: new Date().toISOString(),
      // Les séries jamais validées sont conservées comme ignorées : rien n'est effacé
      exercises: session.value.exercises.map((entry) => ({
        ...entry,
        sets: entry.sets.map((set) =>
          set.status === 'planned' ? { ...set, status: 'skipped' as const } : set,
        ),
      })),
    }
    session.value = completed
    await flush()
    if (sync.value !== 'saved') return null
    reset()
    return completed
  }

  async function abandon() {
    if (!session.value) return
    session.value = { ...session.value, status: 'abandoned', endedAt: new Date().toISOString() }
    await flush()
    reset()
  }

  function reset() {
    clearTimeout(saveTimer)
    session.value = null
    sync.value = 'saved'
  }

  return {
    session,
    exercises,
    lastPerformances,
    sync,
    loaded,
    hasSession,
    load,
    start,
    startFromProgram,
    startFromScheduled,
    flush,
    addExercise,
    removeExercise,
    moveExercise,
    addSet,
    updateSet,
    copyPreviousSet,
    toggleSetDone,
    removeSet,
    finish,
    abandon,
  }
})
