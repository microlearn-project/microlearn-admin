<script setup lang="ts">
// Désactiver le layout par défaut pour cette page
definePageMeta({
  layout: false,
});

const { login, authenticated } = useAuth();
const toast = useToast();

// Si déjà connecté, rediriger
if (authenticated.value) {
  navigateTo("/");
}

// Type de connexion : email ou code
const loginType = ref<"email" | "code">("code");

// Formulaire
const form = ref({
  identifier: "",
  password: "",
  showPassword: false,
});

const loading = ref(false);

// Labels dynamiques selon le type
const identifierLabel = computed(() =>
  loginType.value === "email" ? "Adresse email" : "Code agent"
);

const identifierPlaceholder = computed(() =>
  loginType.value === "email" ? "votre.email@exemple.com" : "Votre code agent"
);

const identifierIcon = computed(() =>
  loginType.value === "email" ? "i-lucide-mail" : "i-lucide-hash"
);

// Basculer le type de connexion
function toggleLoginType() {
  loginType.value = loginType.value === "email" ? "code" : "email";
  form.value.identifier = "";
}

// Soumettre le formulaire
async function handleSubmit() {
  // Validation
  if (!form.value.identifier.trim()) {
    toast.add({
      title: "Erreur",
      description: `Veuillez entrer votre ${loginType.value === "email" ? "email" : "code agent"}`,
      color: "error",
    });
    return;
  }

  if (!form.value.password) {
    toast.add({
      title: "Erreur",
      description: "Veuillez entrer votre mot de passe",
      color: "error",
    });
    return;
  }

  loading.value = true;

  const result = await login(
    form.value.identifier.trim(),
    form.value.password,
    loginType.value
  );

  loading.value = false;

  if (result.success) {
    toast.add({
      title: "Connexion réussie",
      description: "Bienvenue sur l'interface d'administration",
      color: "success",
    });

    // Rediriger vers le dashboard
    navigateTo("/");
  } else {
    toast.add({
      title: "Échec de connexion",
      description: result.error,
      color: "error",
    });
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default p-4">
    <div class="w-full max-w-md">
      <!-- Logo / Titre -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-lucide-graduation-cap" class="text-primary text-3xl" />
        </div>
        <h1 class="text-2xl font-bold">UTB Learn Administration</h1>
        <p class="text-muted mt-2">Connectez-vous pour accéder au tableau de bord</p>
      </div>

      <!-- Carte de connexion -->
      <div class="bg-elevated border border-default rounded-xl p-6 shadow-lg">
        <!-- Sélecteur de type de connexion -->
        <div class="flex gap-2 p-1 bg-muted/30 rounded-lg mb-6">
          <button
            type="button"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
            :class="
              loginType === 'code'
                ? 'bg-default shadow text-foreground'
                : 'text-muted hover:text-foreground'
            "
            @click="loginType = 'code'"
          >
            <UIcon name="i-lucide-hash" class="mr-2" />
            Code agent
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all"
            :class="
              loginType === 'email'
                ? 'bg-default shadow text-foreground'
                : 'text-muted hover:text-foreground'
            "
            @click="loginType = 'email'"
          >
            <UIcon name="i-lucide-mail" class="mr-2" />
            Email
          </button>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Identifiant -->
          <UFormField :label="identifierLabel">
            <UInput
              v-model="form.identifier"
              :placeholder="identifierPlaceholder"
              :icon="identifierIcon"
              size="lg"
              autocomplete="username"
               class="w-full"
            />
          </UFormField>

          <!-- Mot de passe -->
          <UFormField label="Mot de passe">
            <UInput
              v-model="form.password"
              :type="form.showPassword ? 'text' : 'password'"
              placeholder="Votre mot de passe"
              icon="i-lucide-lock"
              size="lg"
              autocomplete="current-password"
               class="w-full"
            >
              <template #trailing>
                <UButton
                  :icon="form.showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click="form.showPassword = !form.showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- Bouton connexion -->
          <UButton
            type="submit"
            label="Se connecter"
            color="primary"
            size="lg"
            block
            :loading="loading"
            class="mt-6"
          />
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-muted mt-6">
        © {{ new Date().getFullYear() }} UTB Learn Administration - Système de gestion des formations
      </p>
    </div>
  </div>
</template>
