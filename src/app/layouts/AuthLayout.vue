<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'
</script>

<template>
  <div class="auth-layout">
    <aside class="auth-layout__brand" aria-hidden="true">
      <AppLogo :size="40" />
      <p class="auth-layout__motto">Forge ta progression.</p>
      <p class="auth-layout__pitch">
        Chaque séance consignée devient un repère. Planifie, saisis en quelques gestes, constate ce
        qui avance.
      </p>
    </aside>

    <main id="main-content" class="auth-layout__main" tabindex="-1">
      <AppLogo class="auth-layout__mobile-logo" :size="32" />
      <div class="auth-layout__panel">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  min-height: 100dvh;
}

.auth-layout__brand {
  display: none;
}

.auth-layout__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding: var(--space-6) var(--space-4);
}

.auth-layout__main:focus {
  outline: none;
}

.auth-layout__panel {
  width: 100%;
  max-width: 26rem;
}

@media (width >= 64rem) {
  .auth-layout {
    grid-template-columns: minmax(0, 1fr) minmax(28rem, 0.8fr);
  }

  .auth-layout__brand {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--space-5);
    padding: var(--space-8);
    background:
      radial-gradient(120% 80% at 0% 100%, var(--color-accent-soft) 0%, transparent 60%),
      var(--color-bg-sunken);
    border-right: 1px solid var(--color-border);
  }

  .auth-layout__brand > :first-child {
    margin-bottom: auto;
  }

  .auth-layout__motto {
    font-size: var(--font-size-display);
    font-weight: var(--font-weight-black);
    font-stretch: var(--font-stretch-wide);
    line-height: var(--line-height-tight);
  }

  .auth-layout__pitch {
    max-width: 40ch;
    font-size: var(--font-size-lg);
    color: var(--color-text-muted);
  }

  .auth-layout__main {
    justify-content: center;
    padding: var(--space-8);
  }

  .auth-layout__mobile-logo {
    display: none;
  }
}
</style>
