<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { user, fetchUser } = useAuth()
const toast = useToast()

// Schéma de validation
const profileSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide')
})

type ProfileSchema = z.output<typeof profileSchema>

// État du formulaire
const loading = ref(false)
const loadingProfile = ref(true)

const profile = reactive<Partial<ProfileSchema> & {
  code_agent?: string
  departement?: string
  service?: string
  created_at?: string
}>({
  nom: '',
  prenom: '',
  email: '',
  code_agent: '',
  departement: '',
  service: '',
  created_at: ''
})

// Charger le profil complet
async function loadProfile() {
  loadingProfile.value = true
  try {
    const data = await $fetch('/api/auth/profile')

    profile.nom = data.nom
    profile.prenom = data.prenom
    profile.email = data.email
    profile.code_agent = data.code_agent
    profile.departement = (data.direction as any)?.designation || ''
    profile.service = (data.departement as any)?.designation || ''
    profile.created_at = data.created_at
  } catch (err) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de charger le profil',
      color: 'error'
    })
  } finally {
    loadingProfile.value = false
  }
}

// Charger au montage
onMounted(() => {
  loadProfile()
})

// Soumettre les modifications
async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  loading.value = true

  try {
    await $fetch('/api/auth/profile', {
      method: 'PATCH',
      body: {
        nom: event.data.nom,
        prenom: event.data.prenom,
        email: event.data.email
      }
    })

    toast.add({
      title: 'Succès',
      description: 'Votre profil a été mis à jour.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Rafraîchir les données de session
    await fetchUser()
  } catch (err: any) {
    toast.add({
      title: 'Erreur',
      description: err?.data?.statusMessage || 'Impossible de mettre à jour le profil',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Initiales pour l'avatar
const initials = computed(() => {
  if (!profile.prenom || !profile.nom) return '?'
  return `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase()
})

// Formater la date de création
const formattedCreatedAt = computed(() => {
  if (!profile.created_at) return ''
  return new Date(profile.created_at).toLocaleDateString('fr-FR', {
    dateStyle: 'long'
  })
})
</script>

<template>
  <div v-if="loadingProfile" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-circle" class="animate-spin text-3xl text-muted" />
  </div>

  <UForm
    v-else
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Profil"
      description="Gérez vos informations personnelles."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Enregistrer"
        color="neutral"
        type="submit"
        :loading="loading"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- Avatar et infos de base -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
          {{ initials }}
        </div>
        <div>
          <p class="font-medium text-lg">{{ profile.prenom }} {{ profile.nom }}</p>
          <p class="text-muted text-sm">{{ user?.role?.designation || 'Agent' }}</p>
        </div>
      </div>

      <USeparator />

      <!-- Code agent (lecture seule) -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4 py-4">
        <div>
          <p class="font-medium">Code agent</p>
          <p class="text-sm text-muted">Votre identifiant unique de connexion</p>
        </div>
        <div class="flex items-center gap-2">
          <code class="px-3 py-2 bg-muted/30 rounded-md font-mono text-sm">
            {{ profile.code_agent }}
          </code>
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="() => {
              navigator.clipboard.writeText(profile.code_agent || '')
              toast.add({ title: 'Code copié' })
            }"
          />
        </div>
      </div>

      <USeparator />

      <!-- Prénom -->
      <UFormField
        name="prenom"
        label="Prénom"
        description="Votre prénom tel qu'il apparaîtra dans l'application."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.prenom"
          autocomplete="given-name"
          class="w-full sm:max-w-xs"
        />
      </UFormField>

      <USeparator />

      <!-- Nom -->
      <UFormField
        name="nom"
        label="Nom"
        description="Votre nom de famille."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.nom"
          autocomplete="family-name"
          class="w-full sm:max-w-xs"
        />
      </UFormField>

      <USeparator />

      <!-- Email -->
      <UFormField
        name="email"
        label="Email"
        description="Utilisé pour les notifications et la récupération de compte."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.email"
          type="email"
          autocomplete="email"
          class="w-full sm:max-w-xs"
        />
      </UFormField>

      <USeparator />

      <!-- Département (lecture seule) -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4 py-4">
        <div>
          <p class="font-medium">Direction</p>
          <p class="text-sm text-muted">Votre direction d'affectation</p>
        </div>
        <div class="px-3 py-2 bg-muted/20 rounded-md text-sm">
          {{ profile.departement || 'Non défini' }}
        </div>
      </div>

      <USeparator />

      <!-- Service (lecture seule) -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4 py-4">
        <div>
          <p class="font-medium">Département</p>
          <p class="text-sm text-muted">Votre département d'affectation</p>
        </div>
        <div class="px-3 py-2 bg-muted/20 rounded-md text-sm">
          {{ profile.service || 'Non défini' }}
        </div>
      </div>

      <USeparator />

      <!-- Date de création (lecture seule) -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4 py-4">
        <div>
          <p class="font-medium">Membre depuis</p>
          <p class="text-sm text-muted">Date de création de votre compte</p>
        </div>
        <div class="px-3 py-2 bg-muted/20 rounded-md text-sm">
          {{ formattedCreatedAt }}
        </div>
      </div>
    </UPageCard>
  </UForm>
</template>
