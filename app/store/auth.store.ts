import type { TSignUpReq } from '~~/shared/schemas/auth/SignUpReqSchema'
import type { TCity } from '~~/shared/schemas/cities/CitySchema'
import type { TUserRes } from '~~/shared/schemas/users/UserResSchema'

export const useAuthStore = defineStore('authStore', () => {
  const supabase = useSupabaseClient()

  const user = ref<TUserRes | null>(null)

  async function signIn (email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    user.value = await authService.getMe()
  }

  // Our server creates the auth user and the `users` row together; signing in afterwards sets the session cookie
  async function signUp (body: TSignUpReq) {
    await authService.signUp(body)
    await signIn(body.email, body.password)
  }

  async function fetchMe () {
    user.value = await authService.getMe()

    return user.value
  }

  // The trip request form reads its default origin from here, so it follows without a reload
  async function updateHomeCity (homeCity: TCity) {
    user.value = await authService.updateMe({ homeCity })
  }

  async function signOut () {
    await supabase.auth.signOut()
    // Hard reload drops every store holding the previous user's data
    reloadNuxtApp({ path: useRouter().resolve({ name: 'login' }).href, force: true })
  }

  return {
    user,
    signIn,
    signUp,
    fetchMe,
    updateHomeCity,
    signOut
  }
})
