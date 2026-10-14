import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { WorkoutSession } from '@/types/domain'

import SessionFinishDialog from '../SessionFinishDialog.vue'

const session: WorkoutSession = {
  id: 's1',
  userId: 'u1',
  title: 'Push',
  status: 'active',
  startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  exercises: [
    {
      id: 'a',
      exerciseId: 'bench-press',
      sets: [
        { id: 's1', kind: 'warmup', status: 'done', reps: 10, load: 40, unit: 'kg' },
        { id: 's2', kind: 'working', status: 'done', reps: 8, load: 80, unit: 'kg' },
        { id: 's3', kind: 'working', status: 'planned', reps: 8, load: 80, unit: 'kg' },
      ],
    },
  ],
}

function mountDialog() {
  return mount(SessionFinishDialog, {
    props: { session, open: true },
    attachTo: document.body,
  })
}

describe('SessionFinishDialog', () => {
  it('résume la séance avant de l’enregistrer', () => {
    const wrapper = mountDialog()
    const stats = wrapper.findAll('.finish__stat').map((node) => node.text())
    expect(stats).toEqual(['Durée45 min', 'Séries validées2', 'Répétitions18', 'Volume640 kg'])
  })

  it('termine sans ressenti ni note', async () => {
    const wrapper = mountDialog()
    const confirm = wrapper.findAll('button').find((button) => button.text() === 'Terminer')
    await confirm!.trigger('click')
    expect(wrapper.emitted('confirm')?.[0]).toEqual([{ note: undefined, feeling: undefined }])
  })

  it('transmet le ressenti et la note saisis', async () => {
    const wrapper = mountDialog()
    await wrapper.findAll('input[type="radio"]')[3]!.setValue(true)
    await wrapper.get('textarea').setValue('  Dos fatigué  ')

    const confirm = wrapper.findAll('button').find((button) => button.text() === 'Terminer')
    await confirm!.trigger('click')
    expect(wrapper.emitted('confirm')?.[0]).toEqual([{ note: 'Dos fatigué', feeling: 4 }])
  })

  it('laisse reprendre la séance sans rien enregistrer', async () => {
    const wrapper = mountDialog()
    const cancel = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Continuer la séance')
    await cancel!.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})
