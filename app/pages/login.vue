<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { login, authenticated } = useAuth();
const toast = useToast();

if (authenticated.value) {
  navigateTo("/");
}

const loginType = ref<"email" | "code">("code");

const form = ref({
  identifier: "",
  password: "",
  showPassword: false,
});

const loading = ref(false);

//  État pour la confirmation de session active
const sessionConflict = ref(false);
const sessionInfo = ref<any>(null);

const identifierLabel = computed(() =>
  loginType.value === "email" ? "Adresse email" : "Code agent",
);

const identifierPlaceholder = computed(() =>
  loginType.value === "email" ? "votre.email@exemple.com" : "Votre code agent",
);

const identifierIcon = computed(() =>
  loginType.value === "email" ? "i-lucide-mail" : "i-lucide-hash",
);

function toggleLoginType() {
  loginType.value = loginType.value === "email" ? "code" : "email";
  form.value.identifier = "";
}

// Gestion de la connexion avec confirmation
async function handleSubmit(forceLogin = false) {
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
    loginType.value,
    forceLogin, 
  );

  loading.value = false;

  //  Gestion du conflit de session
  if (!result.success && result.requiresConfirmation) {
    sessionConflict.value = true;
    sessionInfo.value = result.sessionInfo;
    toast.add({
      title: "Session active détectée",
      description: result.message,
      color: "warning",
    });
    return;
  }

  if (result.success) {
    toast.add({
      title: "Connexion réussie",
      description: "Bienvenue sur l'interface d'administration",
      color: "success",
    });
    navigateTo("/");
  } else {
    toast.add({
      title: "Échec de connexion",
      description: result.error,
      color: "error",
    });
  }
}

//  Forcer la connexion en fermant la session active
function confirmForceLogin() {
  sessionConflict.value = false;
  handleSubmit(true);
}

//  Annuler la connexion forcée
function cancelForceLogin() {
  sessionConflict.value = false;
  sessionInfo.value = null;
  form.value.password = "";
}
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
        <p class="text-muted mt-2">
          Connectez-vous pour accéder au tableau de bord
        </p>
      </div>

      <!--  Modal de confirmation session active -->
      <UModal
        v-model:open="sessionConflict"
        title="Session active détectée"
        :ui="{ width: 'sm:max-w-lg' }"
      >
        <template #body>
          <div class="space-y-4">
            <div
              class="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg"
            >
              <UIcon
                name="i-lucide-alert-triangle"
                class="text-warning text-xl mt-0.5"
              />
              <div class="flex-1">
                <p class="font-medium text-warning mb-1">
                  Une session est déjà ouverte
                </p>
                <p class="text-sm text-muted">
                  Vous êtes déjà connecté sur un autre navigateur ou appareil.
                </p>
              </div>
            </div>

            <div v-if="sessionInfo" class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Connecté depuis :</span>
                <span class="font-medium">
                  {{ new Date(sessionInfo.created_at).toLocaleString("fr-FR") }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Dernière activité :</span>
                <span class="font-medium">
                  {{
                    new Date(sessionInfo.last_activity).toLocaleString("fr-FR")
                  }}
                </span>
              </div>
            </div>

            <p class="text-sm">
              Si vous continuez, l'autre session sera automatiquement fermée.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              @click="cancelForceLogin"
            />
            <UButton
              label="Continuer et fermer l'autre session"
              color="warning"
              icon="i-lucide-log-in"
              @click="confirmForceLogin"
            />
          </div>
        </template>
      </UModal>

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
        <form @submit.prevent="handleSubmit(false)" class="space-y-4">
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
                  :icon="
                    form.showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'
                  "
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :padded="false"
                  @click="form.showPassword = !form.showPassword"
                />
              </template>
            </UInput>
          </UFormField>

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

      <p class="text-center text-sm text-muted mt-6">
        © {{ new Date().getFullYear() }} UTB Learn Administration
      </p>
    </div>
  </div>
</template>
