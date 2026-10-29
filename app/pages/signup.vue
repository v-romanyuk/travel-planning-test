<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="font-display font-bold text-3xl tracking-tight text-highlighted">
        Create an account
      </h1>
      <p class="text-muted">
        Tell us where you live so the planner knows where your trips start.
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-1" @submit="onSubmit">
      <UFormField label="Full name" name="fullName">
        <UInput v-model="state.fullName" autocomplete="name" size="xl" class="w-full" />
      </UFormField>

      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" autocomplete="email" size="xl" class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password" help="At least 8 characters">
        <PasswordInput v-model="state.password" autocomplete="new-password" />
      </UFormField>

      <UFormField label="Confirm password" name="passwordConfirmation">
        <PasswordInput v-model="state.passwordConfirmation" autocomplete="new-password" />
      </UFormField>

      <UFormField label="Home city" name="homeCity" help="Your trips start here by default">
        <CitySelect v-model="state.homeCity" />
      </UFormField>

      <UButton type="submit" size="xl" block :loading="loading" class="mt-2">
        Create account
      </UButton>
    </UForm>

    <p class="text-sm text-muted">
      Already have an account?
      <ULink :to="{ name: 'login' }" class="font-semibold text-primary">
        Log in
      </ULink>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import { SignUpReqSchema } from '~~/shared/schemas/auth/SignUpReqSchema'
import type { TCity } from '~~/shared/schemas/cities/CitySchema'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useHead({ title: 'Sign up' })

const authStore = useAuthStore()
const toast = useToast()
const toErrorMessage = useAuthErrorMessage()

// The confirmation is a form-only check; the API takes the password once
const schema = SignUpReqSchema
  .extend({ passwordConfirmation: z.string() })
  .refine(data => data.password === data.passwordConfirmation, {
    message: 'Passwords don\'t match',
    path: ['passwordConfirmation'],
    // Object refinements are skipped while any field fails; run this one as soon as both passwords are filled
    when: ({ value }) => {
      const { password, passwordConfirmation } = value as Record<string, unknown>

      return typeof password === 'string' && typeof passwordConfirmation === 'string'
    }
  })

const state = reactive<{
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
  homeCity: TCity | undefined
}>({ fullName: '', email: '', password: '', passwordConfirmation: '', homeCity: undefined })
const loading = ref(false)

async function onSubmit (event: FormSubmitEvent<z.output<typeof schema>>) {
  const { passwordConfirmation, ...body } = event.data

  loading.value = true
  try {
    await authStore.signUp(body)
    await navigateTo({ name: 'index' })
  } catch (error) {
    toast.add({ title: 'Couldn\'t create your account', description: toErrorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
