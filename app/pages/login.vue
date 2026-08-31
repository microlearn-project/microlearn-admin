<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { login, authenticated } = useAuth();
const route = useRoute();

if (authenticated.value) {
  navigateTo("/");
}

const redirectTo = computed(() => {
  const value = route.query.redirect;
  return typeof value === "string" ? value : undefined;
});

const errorMessages: Record<string, string> = {
  invalid_state: "La session de connexion a expiré. Veuillez réessayer.",
  token_exchange_failed: "La connexion a échoué. Veuillez réessayer.",
  no_agent_match:
    "Aucun agent de la plateforme ne correspond à ce compte. Contactez un administrateur.",
  no_admin_access:
    "Votre compte n'a pas les permissions nécessaires pour accéder à l'administration. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.",
};

const errorMessage = computed(() => {
  const code = route.query.error;
  if (typeof code !== "string") return null;
  return errorMessages[code] ?? "Une erreur est survenue lors de la connexion.";
});

function handleLogin() {
  login(redirectTo.value);
}

// Redirection automatique vers Keycloak, sans page intermédiaire à cliquer
// (même logique que console.neon.tech) — sauf s'il y a une erreur à
// afficher (retour d'un échec de connexion) : dans ce cas on ne redirige
// jamais automatiquement, sinon l'utilisateur ne verrait jamais le message
// et boucherait indéfiniment sur un nouvel échec.
//
// Dans onMounted (jamais au niveau racine du <script setup>) : cette page
// est rendue côté serveur (SSR) comme toute page Nuxt, et login() fait
// window.location.href — window n'existe pas côté serveur, ce qui plantait
// le rendu SSR avec "Cannot read properties of undefined (reading
// 'location')". onMounted ne s'exécute jamais côté serveur, uniquement
// après hydratation dans le navigateur.
onMounted(() => {
  if (!authenticated.value && !errorMessage.value) {
    login(redirectTo.value);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default p-4">
    <div class="w-full max-w-md">
      <!-- Logo / Titre -->
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <UIcon name="i-lucide-graduation-cap" class="text-primary text-3xl" />
        </div>
        <h1 class="text-2xl font-bold">UTB Learn Administration</h1>
      </div>

      <!-- Pas d'erreur : redirection auto en cours, simple indicateur -->
      <div v-if="!errorMessage" class="flex flex-col items-center gap-3 py-4">
        <UIcon
          name="i-lucide-loader-circle"
          class="text-primary text-3xl animate-spin"
        />
        <p class="text-muted text-sm">Redirection vers la connexion...</p>
      </div>

      <!-- Erreur : pas de redirection auto, l'utilisateur doit voir le message -->
      <div v-else class="bg-elevated border border-default rounded-xl p-6 shadow-lg">
        <div
          class="flex items-start gap-3 p-4 mb-4 bg-error/10 border border-error/20 rounded-lg"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="text-error text-xl mt-0.5 shrink-0"
          />
          <p class="text-sm">{{ errorMessage }}</p>
        </div>

        <p class="text-sm text-muted mb-4">
          L'identification se fait via le service d'authentification de
          l'organisation. Vous serez redirigé pour saisir votre code agent
          et votre mot de passe.
        </p>

        <UButton
          label="Réessayer"
          icon="i-lucide-log-in"
          color="primary"
          size="lg"
          block
          @click="handleLogin"
        />
      </div>

      <p class="text-center text-sm text-muted mt-6">
        © {{ new Date().getFullYear() }} UTB Learn Administration
      </p>
    </div>
  </div>
</template>
