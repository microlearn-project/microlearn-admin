<template>
  <div class="fixed inset-0 bg-background z-9999 flex items-center justify-center">
    <div class="text-center space-y-4">
      <!-- Logo ou nom de l'app (optionnel) -->
      <div class="flex items-center justify-center mb-6">
        <div class="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-lucide-graduation-cap" class="text-4xl text-primary" />
        </div>
      </div>

      <!-- Spinner -->
      <div class="flex justify-center">
        <div class="relative">
          <!-- Cercle externe qui tourne -->
          <div class="w-12 h-12 border-4 border-muted/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>

      <!-- Texte -->
      <div class="space-y-1">
        <p class="text-sm font-medium">Vérification...</p>
        <p class="text-xs text-muted">Chargement de votre session</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animation plus fluide */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
