import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import TextField from '../TextField.vue'

describe('TextField', () => {
  it('associe le libellé au champ', () => {
    const wrapper = mount(TextField, { props: { label: 'Adresse e-mail', type: 'email' } })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('type')).toBe('email')
  })

  it('met à jour le modèle à la saisie', async () => {
    const wrapper = mount(TextField, { props: { label: 'Nom', modelValue: '' } })
    await wrapper.get('input').setValue('Alex')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Alex'])
  })

  it("expose l'erreur aux technologies d'assistance", () => {
    const wrapper = mount(TextField, {
      props: { label: 'Mot de passe', hint: '8 caractères minimum', error: 'Trop court' },
    })
    const input = wrapper.get('input')
    const error = wrapper.get('[role="alert"]')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(error.attributes('id'))
    expect(error.text()).toBe('Trop court')
  })

  it("affiche l'aide quand il n'y a pas d'erreur", () => {
    const wrapper = mount(TextField, { props: { label: 'Mot de passe', hint: 'Indice' } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.text()).toContain('Indice')
  })
})
