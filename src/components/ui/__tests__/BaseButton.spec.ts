import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import BaseButton from '../BaseButton.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:any(.*)*', component: { template: '<div />' } }],
})

describe('BaseButton', () => {
  it('rend un bouton de type « button » par défaut', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Enregistrer' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Enregistrer')
    expect(button.classes()).toContain('button--primary')
  })

  it('rend un lien quand une destination est fournie', async () => {
    const wrapper = mount(BaseButton, {
      props: { to: '/entrainement' },
      slots: { default: 'Démarrer' },
      global: { plugins: [router] },
    })
    await router.isReady()
    expect(wrapper.get('a').attributes('href')).toBe('/entrainement')
  })

  it('désactive le bouton et signale le chargement', () => {
    const wrapper = mount(BaseButton, { props: { loading: true }, slots: { default: 'Envoyer' } })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-busy')).toBe('true')
  })

  it("n'émet pas de clic quand il est désactivé", async () => {
    const wrapper = mount(BaseButton, { props: { disabled: true }, slots: { default: 'Go' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
