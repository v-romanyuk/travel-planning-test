// Signed-in users have no business on the login / signup pages
export default defineNuxtRouteMiddleware(() => {
  if (useSupabaseUser().value) return navigateTo({ name: 'index' })
})
