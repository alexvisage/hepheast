import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { routes } from '@/app/router/routes'
import { services } from '@/services'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toasts'

import ProfileView from '../views/ProfileView.vue'

/** Compte réel de l'adaptateur local : les enregistrements passent par les services */
async function signUp() {
  const session = useSessionStore()
  await session.signUp({
    email: 'alex@example.com',
    password: 'motdepasse1',
    displayName: 'Alex',
  })
}

describe('ProfileView', () => {
  let router: Router

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/profil')
    await router.isReady()
  })

  function mountProfile() {
    return mount(ProfileView, { global: { plugins: [router] } })
  }

  function button(wrapper: ReturnType<typeof mount>, label: string) {
    return wrapper.findAll('button').find((node) => node.text() === label)!
  }

  /** jsdom ne déclenche pas la soumission depuis le clic : on l'envoie au formulaire */
  function submit(wrapper: ReturnType<typeof mount>, which: 'profile' | 'preferences') {
    return wrapper.findAll('form')[which === 'profile' ? 0 : 1]!.trigger('submit')
  }

  function group(wrapper: ReturnType<typeof mount>, legend: string) {
    return wrapper.findAll('fieldset').find((node) => node.text().includes(legend))!
  }

  it('invite à se connecter sans compte chargé', () => {
    const wrapper = mountProfile()
    expect(wrapper.text()).toContain('Aucun compte chargé')
  })

  it('reprend le profil et les préférences enregistrés', async () => {
    await signUp()
    const wrapper = mountProfile()

    expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('Alex')
    expect(wrapper.text()).toContain('alex@example.com')
    const week = group(wrapper, 'La semaine commence le')
    expect((week.findAll('input')[0]!.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.text()).toContain('Soit 2:00 entre deux séries.')
  })

  it('enregistre le nom affiché', async () => {
    await signUp()
    const wrapper = mountProfile()

    await wrapper.get('input[type="text"]').setValue('Alexandre')
    await submit(wrapper, 'profile')

    await vi.waitFor(() => expect(useSessionStore().user?.displayName).toBe('Alexandre'))
    // Et côté services, pas seulement en mémoire
    expect((await services.auth.getCurrentUser())?.displayName).toBe('Alexandre')
    expect(useToastStore().toasts.at(-1)?.message).toBe('Profil enregistré')
  })

  it('refuse un nom trop court sans toucher au compte', async () => {
    await signUp()
    const wrapper = mountProfile()

    await wrapper.get('input[type="text"]').setValue('A')
    await submit(wrapper, 'profile')

    expect(wrapper.text()).toContain('Votre nom doit contenir au moins 2 caractères')
    expect(useSessionStore().user?.displayName).toBe('Alex')
  })

  it('enregistre unité, premier jour de semaine, fuseau et repos', async () => {
    await signUp()
    const wrapper = mountProfile()

    await group(wrapper, 'Unité de charge').findAll('input')[1]!.setValue(true)
    await group(wrapper, 'La semaine commence le').findAll('input')[1]!.setValue(true)
    await wrapper.get('select').setValue('Asia/Tokyo')
    const rest = wrapper.get('.profile__rest input')
    await rest.setValue('90')
    await rest.trigger('blur')
    await wrapper.get('input[type="checkbox"]').setValue(false)

    await submit(wrapper, 'preferences')

    await vi.waitFor(() =>
      expect(useSessionStore().preferences).toMatchObject({
        unit: 'lb',
        weekStartsOn: 0,
        timeZone: 'Asia/Tokyo',
        defaultRestSeconds: 90,
        autoRest: false,
      }),
    )
    expect(useToastStore().toasts.at(-1)?.message).toBe('Préférences enregistrées')
  })

  it('applique le repos minimal plutôt qu’une valeur absurde', async () => {
    await signUp()
    const wrapper = mountProfile()

    const rest = wrapper.get('.profile__rest input')
    await rest.setValue('2')
    await rest.trigger('blur')
    await submit(wrapper, 'preferences')

    // Le stepper borne déjà la saisie : 15 secondes au minimum
    await vi.waitFor(() => expect(useSessionStore().preferences?.defaultRestSeconds).toBe(15))
  })

  it('déconnecte et renvoie vers la connexion', async () => {
    await signUp()
    const wrapper = mountProfile()

    await button(wrapper, 'Se déconnecter').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
    expect(useSessionStore().user).toBeNull()
  })
})
