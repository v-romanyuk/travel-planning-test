<template>
  <!-- Only the area under the site header scrolls, so the header never moves -->
  <div class="h-full flex flex-col bg-muted">
    <header class="shrink-0 z-30 bg-default border-b border-default">
      <div class="max-w-5xl mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <AppLogo />

        <nav aria-label="Main" class="flex flex-wrap gap-1">
          <NuxtLink
            v-for="link in links"
            :key="link.name"
            :to="{ name: link.name }"
            class="px-3.5 py-2.5 rounded-full font-medium"
            :class="isActive(link) ? 'bg-primary-100 text-primary font-semibold' : 'text-muted hover:text-highlighted'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div v-if="authStore.user" class="flex items-center gap-2">
          <span class="hidden sm:inline text-sm text-muted">{{ authStore.user.fullName }}</span>
          <UButton
            icon="icon:log-out"
            color="neutral"
            variant="ghost"
            aria-label="Log out"
            @click="authStore.signOut"
          />
        </div>
      </div>
    </header>

    <div ref="pageScroll" class="grow min-h-0 overflow-y-auto">
      <main class="max-w-5xl w-full mx-auto px-5 py-8">
        <slot />
      </main>
    </div>

    <Modals />
  </div>
</template>

<script lang="ts" setup>
import type { RouteNamedMap } from 'vue-router/auto-routes'

interface INavLink {
  name: keyof RouteNamedMap
  label: string
  section: string
}

useHead({
  titleTemplate: title => title ? `${title} | Trip Planner` : 'Trip Planner'
})

const route = useRoute()
const pageScroll = useTemplateRef('pageScroll')

// The router scrolls the window, which never scrolls here; a new page starts at the top of its own scroll area
watch(() => route.path, () => {
  pageScroll.value?.scrollTo({ top: 0 })
})
const authStore = useAuthStore()
const supabaseUser = useSupabaseUser()

// A session without our `users` row (or a revoked one) can't use the API, so end it
if (supabaseUser.value && !authStore.user) {
  await authStore.fetchMe().catch(() => authStore.signOut())
}

// `/trips` and `/trips/:id` are sibling routes, so router active classes can't mark "Trips" on a trip page
const links: INavLink[] = [
  { name: 'index', label: 'Plan a trip', section: '/' },
  { name: 'trips', label: 'Trips', section: '/trips' },
  { name: 'profile', label: 'Profile', section: '/profile' }
]

const isActive = (link: INavLink) => link.section === '/'
  ? route.path === '/'
  : route.path === link.section || route.path.startsWith(`${link.section}/`)
</script>
