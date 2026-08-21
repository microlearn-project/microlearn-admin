<script setup lang="ts">

const isInitialLoading = ref(true);

// Petit délai pour laisser le middleware s'exécuter
onMounted(() => {
  // On attend que le premier check auth soit fait
  setTimeout(() => {
    isInitialLoading.value = false;
  }, 300);
});

// SEO et meta tags
const colorMode = useColorMode();
const color = computed(() =>
  colorMode.value === "dark" ? "#1b1718" : "white",
);

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [{ rel: "icon", href: "/images/favicon.png" }],
  htmlAttrs: {
    lang: "fr",
  },
});

const title = "UTB Learn Administration";
const description =
  "Gérez votre plateforme UTB Learn facilement à l'interface d'administration UTB Learn. Surveillez les performances, gérez les utilisateurs et configurez les paramètres de votre plateforme en toute simplicité.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "/images/favicon.png",
});
</script>

<template>
  <UApp>
    <div>
      <!-- Loading  -->
      <AuthLoadingScreen v-if="isInitialLoading" />

      <!-- Le contenu — <UApp> fournit déjà un TooltipProvider en interne
           (Nuxt UI v4) ; un wrapper explicite ici ne résout à rien. -->
      <div v-show="!isInitialLoading">
        <NuxtLoadingIndicator />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <ShortcutsHelpModal />
      </div>
    </div>
  </UApp>
</template>
