import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import NumberStepper from '../NumberStepper.vue'

describe('NumberStepper', () => {
  it('affiche la valeur et lie le libellé au champ', () => {
    const wrapper = mount(NumberStepper, { props: { label: 'Charge', modelValue: 60 } })
    const input = wrapper.get('input')
    expect(input.element.value).toBe('60')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
  })

  it('incrémente et décrémente du pas configuré', async () => {
    const wrapper = mount(NumberStepper, {
      props: { label: 'Charge', step: 2.5, modelValue: 60 },
    })
    const [minus, plus] = wrapper.findAll('button')
    await plus!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([62.5])
    await wrapper.setProps({ modelValue: 62.5 })
    await minus!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([60])
  })

  it('accepte la virgule décimale à la saisie', async () => {
    const wrapper = mount(NumberStepper, { props: { label: 'Charge', modelValue: null } })
    const input = wrapper.get('input')
    await input.setValue('62,5')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([62.5])
  })

  it('borne la valeur entre min et max', async () => {
    const wrapper = mount(NumberStepper, {
      props: { label: 'Répétitions', min: 0, max: 50, modelValue: null },
    })
    const input = wrapper.get('input')
    await input.setValue('-4')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0])
    await input.setValue('120')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([50])
  })

  it('vide la valeur si la saisie est invalide', async () => {
    const wrapper = mount(NumberStepper, { props: { label: 'Charge', modelValue: 40 } })
    const input = wrapper.get('input')
    await input.setValue('abc')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('explique la correction quand la valeur dépasse le maximum', async () => {
    const wrapper = mount(NumberStepper, {
      props: { label: 'Charge', unit: 'kg', max: 500, modelValue: null },
    })
    const input = wrapper.get('input')
    await input.setValue('900')
    await input.trigger('blur')

    expect(wrapper.get('.stepper__hint').text()).toBe('500 kg au maximum')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.get('.stepper__hint').attributes('id'),
    )
  })

  it('explique la correction sous le minimum et la saisie illisible', async () => {
    const wrapper = mount(NumberStepper, {
      props: { label: 'Répétitions', min: 0, modelValue: null },
    })
    const input = wrapper.get('input')
    await input.setValue('-5')
    await input.trigger('blur')
    expect(wrapper.get('.stepper__hint').text()).toBe('0 au minimum')

    await input.setValue('abc')
    await input.trigger('blur')
    expect(wrapper.get('.stepper__hint').text()).toBe('Nombre attendu')
  })

  it('efface le message dès que la valeur redevient acceptable', async () => {
    const wrapper = mount(NumberStepper, { props: { label: 'Charge', max: 500, modelValue: null } })
    const input = wrapper.get('input')
    await input.setValue('900')
    await input.trigger('blur')
    expect(wrapper.find('.stepper__hint').exists()).toBe(true)

    await input.setValue('120')
    await input.trigger('blur')
    expect(wrapper.find('.stepper__hint').exists()).toBe(false)
  })

  it('donne un libellé explicite aux boutons −/+', () => {
    const wrapper = mount(NumberStepper, {
      props: { label: 'Charge', step: 2.5, modelValue: 60 },
    })
    const labels = wrapper.findAll('button').map((button) => button.attributes('aria-label'))
    expect(labels).toEqual(['Diminuer charge de 2,5', 'Augmenter charge de 2,5'])
  })
})
