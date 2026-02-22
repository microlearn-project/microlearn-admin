<!-- app/components/modules/FileUploadErrorModal.vue -->
<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  fileName: string;
  suggestedName: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// Déterminer quels problèmes sont présents
const issues = computed(() => {
  const problems = [];

  // Vérifier accents
  if (/[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(props.fileName)) {
    problems.push({
      type: "accents",
      icon: "i-lucide-languages",
      title: "Caractères accentués",
      description: "Le fichier contient des accents (é, è, à, ô, ù, etc.)",
    });
  }

  // Vérifier espaces
  if (/\s/.test(props.fileName)) {
    problems.push({
      type: "spaces",
      icon: "i-lucide-space",
      title: "Espaces",
      description: "Le fichier contient des espaces dans le nom",
    });
  }

  // Vérifier caractères spéciaux
  if (/[^a-zA-Z0-9._-\s]/.test(props.fileName.replace(/[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g, ""))) {
    problems.push({
      type: "special",
      icon: "i-lucide-asterisk",
      title: "Caractères spéciaux",
      description: "Le fichier contient des caractères non autorisés (@, #, &, etc.)",
    });
  }

  return problems;
});

function handleClose() {
  open.value = false;
  emit("close");
}

function copyToClipboard() {
  navigator.clipboard.writeText(props.suggestedName);
}
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{ width: 'sm:max-w-2xl' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
          <UIcon name="i-lucide-file-x-2" class="text-error text-xl" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Nom de fichier non autorisé</h3>
          <p class="text-sm text-muted">Le fichier ne peut pas être uploadé avec ce nom</p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Fichier actuel -->
        <div class="p-4 bg-error/5 border border-error/20 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-circle" class="text-error text-xl mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-error mb-1">Fichier actuel</p>
              <code class="text-sm break-all bg-error/10 px-2 py-1 rounded">
                {{ fileName }}
              </code>
            </div>
          </div>
        </div>

        <!-- Problèmes détectés -->
        <div>
          <p class="text-sm font-medium mb-3">Problèmes détectés :</p>
          <div class="space-y-2">
            <div
              v-for="issue in issues"
              :key="issue.type"
              class="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <UIcon :name="issue.icon" class="text-muted text-lg mt-0.5" />
              <div>
                <p class="text-sm font-medium">{{ issue.title }}</p>
                <p class="text-xs text-muted">{{ issue.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Nom suggéré -->
        <div class="p-4 bg-success/5 border border-success/20 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle" class="text-success text-xl mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-success mb-1">Nom suggéré</p>
              <div class="flex items-center gap-2">
                <code class="text-sm break-all bg-success/10 px-2 py-1 rounded flex-1">
                  {{ suggestedName }}
                </code>
                <UButton
                  icon="i-lucide-copy"
                  color="success"
                  variant="ghost"
                  size="xs"
                  @click="copyToClipboard"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="p-4 bg-info/5 border border-info/20 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="text-info text-xl mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-info mb-2">Comment corriger ?</p>
              <ol class="text-sm text-muted space-y-2 list-decimal list-inside">
                <li>Renommez votre fichier en utilisant le nom suggéré ci-dessus</li>
                <li>Ou supprimez manuellement les accents, espaces et caractères spéciaux</li>
                <li>Utilisez uniquement : lettres (a-z), chiffres (0-9), tirets (-), underscores (_) et points (.)</li>
                <li>Réessayez l'upload avec le nouveau nom</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Règles -->
        <details class="group">
          <summary class="cursor-pointer text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors">
            <UIcon
              name="i-lucide-chevron-right"
              class="text-muted group-open:rotate-90 transition-transform"
            />
            Règles de nommage des fichiers
          </summary>
          <div class="mt-3 p-4 bg-elevated rounded-lg space-y-3">
            <div>
              <p class="text-sm font-medium text-success mb-1">✅ Caractères autorisés</p>
              <ul class="text-sm text-muted space-y-1 ml-4">
                <li>• Lettres sans accent : <code class="text-xs">a-z A-Z</code></li>
                <li>• Chiffres : <code class="text-xs">0-9</code></li>
                <li>• Tirets : <code class="text-xs">-</code></li>
                <li>• Underscores : <code class="text-xs">_</code></li>
                <li>• Points : <code class="text-xs">.</code></li>
              </ul>
            </div>
            <div>
              <p class="text-sm font-medium text-error mb-1">❌ Caractères interdits</p>
              <ul class="text-sm text-muted space-y-1 ml-4">
                <li>• Accents : <code class="text-xs">é è à ô ù ç</code></li>
                <li>• Espaces</li>
                <li>• Caractères spéciaux : <code class="text-xs">@ # & % * ( ) [ ] { }</code></li>
              </ul>
            </div>
            <div class="pt-2 border-t border-default">
              <p class="text-xs text-muted">
                <strong>Exemples valides :</strong>
                <code class="text-xs bg-muted/30 px-1 py-0.5 rounded">rapport_final.pdf</code>,
                <code class="text-xs bg-muted/30 px-1 py-0.5 rounded">cours-2024.docx</code>,
                <code class="text-xs bg-muted/30 px-1 py-0.5 rounded">guide_v2.1.txt</code>
              </p>
            </div>
          </div>
        </details>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="J'ai compris"
          color="primary"
          @click="handleClose"
        />
      </div>
    </template>
  </UModal>
</template>
