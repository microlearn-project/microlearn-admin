import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)
  const isShortcutsHelpOpen = ref(false)

  defineShortcuts({
    // Navigation principale
    "g-h": () => router.push("/"),
    "g-a": () => router.push("/agents"),
    "g-p": () => router.push("/permissions"),
    "g-s": () => router.push("/services"),
    "g-d": () => router.push("/documents"),
    "g-m": () => router.push("/settings"),

    // Nouvelles navigations
    "g-o": () => router.push("/modules"),
    "g-r": () => router.push("/progression"),
    "g-q": () => router.push("/quiz-results"),

    // Actions rapides
    n: () => (isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value),
    c: () => {
      if (route.path !== "/modules/create") {
        router.push("/modules/create");
      }
    },

    // Aide
    "?": () => (isShortcutsHelpOpen.value = !isShortcutsHelpOpen.value),

    // Navigation arrière
    escape: () => {
      if (isNotificationsSlideoverOpen.value) {
        isNotificationsSlideoverOpen.value = false;
      } else if (isShortcutsHelpOpen.value) {
        isShortcutsHelpOpen.value = false;
      } else if (window.history.length > 1) {
        router.back();
      }
    }, 
  });

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
    isShortcutsHelpOpen.value = false
  })

  return {
    isNotificationsSlideoverOpen,
    isShortcutsHelpOpen
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
