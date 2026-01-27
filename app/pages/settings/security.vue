<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, FormError } from '@nuxt/ui'

const toast = useToast()

// Schéma de validation
const passwordSchema = z.object({
  current: z.string().min(1, 'Mot de passe actuel requis'),
  new: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirm: z.string().min(1, 'Veuillez confirmer le nouveau mot de passe')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined,
  confirm: undefined
})

const loading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation personnalisée
const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []

  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'Le nouveau mot de passe doit être différent de l\'ancien' })
  }

  if (state.new && state.confirm && state.new !== state.confirm) {
    errors.push({ name: 'confirm', message: 'Les mots de passe ne correspondent pas' })
  }

  return errors
}

// Soumettre le changement de mot de passe
async function onSubmit(event: FormSubmitEvent<PasswordSchema>) {
  // Vérification supplémentaire
  if (event.data.new !== event.data.confirm) {
    toast.add({
      title: 'Erreur',
      description: 'Les mots de passe ne correspondent pas',
      color: 'error'
    })
    return
  }

  loading.value = true

  try {
    await $fetch('/api/auth/password', {
      method: 'PATCH',
      body: {
        currentPassword: event.data.current,
        newPassword: event.data.new
      }
    })

    toast.add({
      title: 'Succès',
      description: 'Votre mot de passe a été modifié.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Réinitialiser le formulaire
    password.current = undefined
    password.new = undefined
    password.confirm = undefined
  } catch (err: any) {
    toast.add({
      title: 'Erreur',
      description: err?.data?.statusMessage || 'Impossible de modifier le mot de passe',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Mot de passe"
    description="Modifiez votre mot de passe pour sécuriser votre compte."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-md"
      @submit="onSubmit"
    >
      <!-- Mot de passe actuel -->
      <UFormField name="current" label="Mot de passe actuel">
        <UInput
          v-model="password.current"
          :type="showCurrentPassword ? 'text' : 'password'"
          placeholder="Entrez votre mot de passe actuel"
          autocomplete="current-password"
          class="w-full"
        >
          <template #trailing>
            <UButton
              :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              @click="showCurrentPassword = !showCurrentPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Nouveau mot de passe -->
      <UFormField name="new" label="Nouveau mot de passe">
        <UInput
          v-model="password.new"
          :type="showNewPassword ? 'text' : 'password'"
          placeholder="Entrez votre nouveau mot de passe"
          autocomplete="new-password"
          class="w-full"
        >
          <template #trailing>
            <UButton
              :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              @click="showNewPassword = !showNewPassword"
            />
          </template>
        </UInput>
        <template #hint>
          <span class="text-xs text-muted">Minimum 6 caractères</span>
        </template>
      </UFormField>

      <!-- Confirmer le nouveau mot de passe -->
      <UFormField name="confirm" label="Confirmer le nouveau mot de passe">
        <UInput
          v-model="password.confirm"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Confirmez votre nouveau mot de passe"
          autocomplete="new-password"
          class="w-full"
        >
          <template #trailing>
            <UButton
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        label="Modifier le mot de passe"
        class="w-fit mt-2"
        type="submit"
        :loading="loading"
      />
    </UForm>
  </UPageCard>

  <!-- Conseils de sécurité -->
  <UPageCard
    title="Conseils de sécurité"
    description="Quelques recommandations pour protéger votre compte."
    variant="subtle"
  >
    <div class="space-y-3">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Utilisez un mot de passe unique que vous n'utilisez nulle part ailleurs</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Mélangez lettres majuscules, minuscules, chiffres et caractères spéciaux</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Évitez les informations personnelles facilement devinables</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Ne partagez jamais votre mot de passe avec qui que ce soit</p>
      </div>
    </div>
  </UPageCard>
</template>
