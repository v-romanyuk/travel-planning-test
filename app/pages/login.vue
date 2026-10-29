<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="font-display font-bold text-3xl tracking-tight text-highlighted">
        Log in
      </h1>
      <p class="text-muted">
        Pick up your trips where the planner left them.
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-1" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" autocomplete="email" size="xl" class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <PasswordInput v-model="state.password" autocomplete="current-password" />
      </UFormField>

      <UButton type="submit" size="xl" block :loading="loading" class="mt-2">
        Log in
      </UButton>
    </UForm>

    <p class="text-sm text-muted">
      New here?
      <ULink :to="{ name: 'signup' }" class="font-semibold text-primary">
        Create an account
      </ULink>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useHead({ title: 'Log in' })

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password')
})

const authStore = useAuthStore()
const toast = useToast()
const toErrorMessage = useAuthErrorMessage()
const redirect = useSupabaseCookieRedirect()

const state = reactive({ email: '', password: '' })
const loading = ref(false)

async function onSubmit () {
  loading.value = true
  try {
    await authStore.signIn(state.email, state.password)
    await navigateTo(redirect.pluck() || { name: 'index' })
  } catch (error) {
    toast.add({ title: 'Couldn\'t log in', description: toErrorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
