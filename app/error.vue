<script setup lang="ts">
import type { NuxtError } from "#app";
import * as Sentry from "@sentry/nuxt";

const props = defineProps<{
  error: NuxtError;
}>();

const router = useRouter();
const isDev = import.meta.dev;

const statusCode = computed(() => Number(props.error?.statusCode) || 500);

interface ErrorPreset {
  icon: string;
  tone: "primary" | "warning" | "error";
  title: string;
  description: string;
}

const PRESETS: Record<number, ErrorPreset> = {
  400: {
    icon: "i-lucide-circle-alert",
    tone: "warning",
    title: "Requête invalide",
    description:
      "La demande n'a pas pu être traitée. Vérifiez l'adresse ou revenez en arrière.",
  },
  401: {
    icon: "i-lucide-log-in",
    tone: "warning",
    title: "Session expirée",
    description:
      "Votre session n'est plus valide. Reconnectez-vous pour continuer.",
  },
  403: {
    icon: "i-lucide-shield-x",
    tone: "warning",
    title: "Accès non autorisé",
    description:
      "Votre compte n'a pas les permissions nécessaires pour voir cette page. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.",
  },
  404: {
    icon: "i-lucide-compass",
    tone: "primary",
    title: "Page introuvable",
    description:
      "La page que vous cherchez n'existe pas, a été déplacée, ou l'adresse est incorrecte.",
  },
  408: {
    icon: "i-lucide-timer-off",
    tone: "warning",
    title: "Délai dépassé",
    description:
      "Le serveur a mis trop de temps à répondre. Vérifiez votre connexion et réessayez.",
  },
  429: {
    icon: "i-lucide-gauge",
    tone: "warning",
    title: "Trop de requêtes",
    description:
      "Vous avez envoyé trop de demandes en peu de temps. Patientez quelques instants avant de réessayer.",
  },
  500: {
    icon: "i-lucide-server-crash",
    tone: "error",
    title: "Erreur serveur",
    description:
      "Une erreur inattendue est survenue de notre côté. L'incident a été enregistré ; réessayez dans un instant.",
  },
  502: {
    icon: "i-lucide-unplug",
    tone: "error",
    title: "Service indisponible",
    description:
      "Le serveur est momentanément injoignable. Réessayez dans quelques instants.",
  },
  503: {
    icon: "i-lucide-wrench",
    tone: "error",
    title: "Service en maintenance",
    description:
      "L'administration est temporairement indisponible. Merci de réessayer plus tard.",
  },
};

const preset = computed<ErrorPreset>(
  () =>
    PRESETS[statusCode.value] ?? {
      icon: "i-lucide-triangle-alert",
      tone: "error",
      title: "Une erreur est survenue",
      description:
        props.error?.statusMessage
        || props.error?.message
        || "Quelque chose s'est mal passé. Réessayez ou revenez au tableau de bord.",
    },
);

const TONES = {
  primary: { badge: "text-primary ring-primary/20", ghost: "text-primary/10" },
  warning: { badge: "text-warning ring-warning/20", ghost: "text-warning/10" },
  error: { badge: "text-error ring-error/20", ghost: "text-error/10" },
};
const tone = computed(() => TONES[preset.value.tone]);

const isAuthError = computed(() => statusCode.value === 401);
const isServerError = computed(() => statusCode.value >= 500);

// Référence de l'événement Sentry/GlitchTip — présente seulement quand une
// erreur a réellement été capturée (donc 5xx : les 4xx sont filtrées par
// beforeSend dans sentry.*.config.ts).
const eventId = ref<string | undefined>();
onMounted(() => {
  try {
    eventId.value = Sentry.lastEventId();
  } catch {
    // SDK non initialisé (DSN absent) — pas de référence à afficher.
  }
});

function goHome() {
  clearError({ redirect: "/" });
}

function goLogin() {
  clearError({ redirect: "/login" });
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    // Laisse la navigation se faire puis nettoie l'état d'erreur.
    setTimeout(() => clearError(), 100);
  } else {
    clearError({ redirect: "/" });
  }
}

function retry() {
  if (import.meta.client) {
    window.location.reload();
  } else {
    clearError({ redirect: "/" });
  }
}

useSeoMeta({
  title: () => `${statusCode.value} — ${preset.value.title}`,
  description: () => preset.value.description,
  robots: "noindex",
});

useHead({
  htmlAttrs: { lang: "fr" },
});
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col items-center justify-center bg-default px-4 py-12">
      <div class="w-full max-w-lg text-center">
        <!-- Filigrane : code HTTP -->
        <div class="relative flex items-center justify-center">
          <span
            class="pointer-events-none select-none font-bold leading-none text-[7rem] sm:text-[9rem]"
            :class="tone.ghost"
            aria-hidden="true"
          >
            {{ statusCode }}
          </span>
          <span
            class="absolute flex items-center justify-center w-16 h-16 rounded-2xl bg-default ring-1 shadow-sm"
            :class="tone.badge"
          >
            <UIcon :name="preset.icon" class="text-3xl" />
          </span>
        </div>

        <h1 class="mt-4 text-2xl font-bold">
          {{ preset.title }}
        </h1>

        <p class="mt-2 text-muted text-balance">
          {{ preset.description }}
        </p>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
          <template v-if="isAuthError">
            <UButton
              label="Se connecter"
              icon="i-lucide-log-in"
              color="primary"
              size="lg"
              @click="goLogin"
            />
          </template>

          <template v-else>
            <UButton
              v-if="isServerError"
              label="Réessayer"
              icon="i-lucide-rotate-cw"
              color="primary"
              size="lg"
              @click="retry"
            />
            <UButton
              label="Retour au tableau de bord"
              icon="i-lucide-house"
              :color="isServerError ? 'neutral' : 'primary'"
              :variant="isServerError ? 'subtle' : 'solid'"
              size="lg"
              @click="goHome"
            />
            <UButton
              label="Page précédente"
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="lg"
              @click="goBack"
            />
          </template>
        </div>

        <!-- Référence support (5xx uniquement) -->
        <p v-if="eventId" class="mt-8 text-xs text-dimmed">
          Référence de l'incident :
          <code class="font-mono text-muted">{{ eventId }}</code>
          <br>
          Communiquez-la au support pour accélérer le diagnostic.
        </p>

        <!-- Détails techniques — développement uniquement -->
        <details
          v-if="isDev && (error?.message || error?.stack)"
          class="mt-8 text-left"
        >
          <summary class="cursor-pointer text-xs text-dimmed hover:text-muted">
            Détails techniques (dev)
          </summary>
          <pre class="mt-2 overflow-x-auto rounded-lg bg-elevated border border-default p-3 text-xs text-muted whitespace-pre-wrap">{{ error?.message }}<template v-if="error?.stack">

{{ error.stack }}</template></pre>
        </details>
      </div>

      <p class="mt-12 text-center text-sm text-muted">
        © {{ new Date().getFullYear() }} UTB Learn Administration
      </p>
    </div>
  </UApp>
</template>
