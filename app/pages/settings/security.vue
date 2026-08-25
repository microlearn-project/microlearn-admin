<script setup lang="ts">
const config = useRuntimeConfig()
const { hasRole } = useAuth()

// La console de compte Keycloak expose plus que le changement de mot de
// passe (sessions actives, appareils, etc.) — accès réservé à SUPERADMIN,
// ADMIN et FORMATEUR passent par un administrateur.
const canAccessAccountConsole = computed(() => hasRole('SUPERADMIN'))
</script>

<template>
  <UPageCard
    title="Mot de passe"
    description="Le mot de passe est géré par le service d'authentification (Keycloak), pas par cette application."
    variant="subtle"
  >
    <div class="space-y-4 max-w-md">
      <template v-if="canAccessAccountConsole">
        <p class="text-sm text-muted">
          Pour changer votre mot de passe, utilisez la console de compte
          Keycloak. Vous y êtes déjà connecté, aucune ressaisie n'est
          nécessaire.
        </p>
        <UButton
          :to="config.public.keycloakAccountUrl"
          target="_blank"
          label="Ouvrir la console de compte"
          icon="i-lucide-external-link"
          trailing
        />
      </template>
      <p v-else class="text-sm text-muted">
        Contactez un administrateur pour réinitialiser votre mot de passe.
      </p>
    </div>
  </UPageCard>

  <!-- Conseils de sécurité -->
  <UPageCard
    title="Conseils de sécurité"
    description="Quelques recommandations pour protéger votre compte."
    variant="subtle"
  >
    <div class="space-y-3">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-circle-check" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Utilisez un mot de passe unique que vous n'utilisez nulle part ailleurs</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-circle-check" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Mélangez lettres majuscules, minuscules, chiffres et caractères spéciaux</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-circle-check" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Évitez les informations personnelles facilement devinables</p>
      </div>
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-circle-check" class="text-success mt-0.5 shrink-0" />
        <p class="text-sm">Ne partagez jamais votre mot de passe avec qui que ce soit</p>
      </div>
    </div>
  </UPageCard>
</template>
