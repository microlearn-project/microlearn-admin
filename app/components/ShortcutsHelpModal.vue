<script setup lang="ts">
const { isShortcutsHelpOpen } = useDashboard();

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["G", "H"], description: "Aller au tableau de bord" },
      { keys: ["G", "A"], description: "Aller aux agents" },
      { keys: ["G", "P"], description: "Aller aux permissions" },
      { keys: ["G", "S"], description: "Aller aux services" },
      { keys: ["G", "D"], description: "Aller aux documents" },
      { keys: ["G", "O"], description: "Aller aux modules" },
      { keys: ["G", "R"], description: "Aller à la progression" },
      { keys: ["G", "Q"], description: "Aller aux résultats quiz" },
      { keys: ["G", "M"], description: "Aller aux paramètres" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["N"], description: "Ouvrir/fermer les notifications" },
      { keys: ["C"], description: "Créer un nouveau module" },
      { keys: ["R"], description: "Actualiser la page" },
      { keys: ["?"], description: "Afficher cette aide" },
      { keys: ["Esc"], description: "Retour / Fermer" },
    ],
  },
];
</script>

<template>
  <UModal
    v-model:open="isShortcutsHelpOpen"
    title="Raccourcis clavier"
    description="Naviguez plus rapidement dans l'interface"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-6">
        <div
          v-for="section in shortcuts"
          :key="section.category"
          class="space-y-3"
        >
          <h3 class="text-sm font-semibold text-highlighted">
            {{ section.category }}
          </h3>

          <div class="space-y-2">
            <div
              v-for="shortcut in section.items"
              :key="shortcut.description"
              class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-elevated/50 transition-colors"
            >
              <span class="text-sm">{{ shortcut.description }}</span>
              <div class="flex items-center gap-1">
                <UKbd
                  v-for="(key, index) in shortcut.keys"
                  :key="index"
                  size="sm"
                >
                  {{ key }}
                </UKbd>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-info/10 border border-info/20 rounded-lg p-4">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-lightbulb" class="text-info mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-info mb-1">Astuce</p>
              <p class="text-muted">
                Utilisez les raccourcis pour gagner du temps et améliorer votre
                productivité. Appuyez sur <UKbd size="sm">?</UKbd> à tout moment
                pour afficher cette aide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Fermer"
          color="neutral"
          variant="outline"
          @click="isShortcutsHelpOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
