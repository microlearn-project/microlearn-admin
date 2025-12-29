<script setup lang="ts">
import type {
  EditorToolbarItem,
  EditorSuggestionMenuItem,
} from '@nuxt/ui'

const content = defineModel<string>({ default: "" })

// Configuration de la toolbar
const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Titres' },
      content: { align: 'start' },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Titre 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Titre 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Titre 3' },
      ]
    }
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Gras' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italique' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Souligné' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Barré' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Liste à puces' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Liste numérotée' } },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Citation' } },
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Lien' } },
    { kind: 'image', icon: 'i-lucide-image', tooltip: { text: 'Image' } },
  ],
  [
    { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Bloc de code' } },
    { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Séparateur' } },
  ]
]

// Menu de suggestions (commande slash /)
const suggestionItems: EditorSuggestionMenuItem[][] = [
  [
    { type: 'label', label: 'Texte' },
    { kind: 'paragraph', label: 'Paragraphe', icon: 'i-lucide-type' },
    { kind: 'heading', level: 1, label: 'Titre 1', icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, label: 'Titre 2', icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, label: 'Titre 3', icon: 'i-lucide-heading-3' },
  ],
  [
    { type: 'label', label: 'Listes' },
    { kind: 'bulletList', label: 'Liste à puces', icon: 'i-lucide-list' },
    { kind: 'orderedList', label: 'Liste numérotée', icon: 'i-lucide-list-ordered' },
  ],
  [
    { type: 'label', label: 'Insérer' },
    { kind: 'blockquote', label: 'Citation', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: 'Bloc de code', icon: 'i-lucide-square-code' },
    { kind: 'horizontalRule', label: 'Séparateur', icon: 'i-lucide-separator-horizontal' },
  ]
]
</script>

<template>
  <div class="relative">
    <UEditor
      v-slot="{ editor }"
      v-model="content"
      placeholder="Commencez à écrire la description de votre module..."
      class="prose prose-neutral dark:prose-invert w-full max-w-none"
    >
      <!-- Toolbar bubble de formatage -->
      <UEditorToolbar :editor="editor" :items="toolbarItems" layout="bubble" />

      <!-- Drag handle pour réorganiser les blocs -->
      <UEditorDragHandle :editor="editor" />

      <!-- Menu slash / pour commandes -->
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
    </UEditor>

    <!-- Indication du nombre de caractères -->
    <div class="absolute bottom-4 right-4 text-xs text-muted bg-elevated/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-default">
      {{ content?.length || 0 }} caractères
    </div>
  </div>
</template>

<style scoped>
/* Styles personnalisés pour l'éditeur */
:deep(.ProseMirror) {
  padding: 1.5rem;
  min-height: 500px;
  outline: none; 
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--color-gray-400);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Titres */
:deep(.ProseMirror h1) {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

/* Listes */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

:deep(.ProseMirror ul li),
:deep(.ProseMirror ol li) {
  margin: 0.25rem 0;
}

/* Blockquote */
:deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--color-primary-500);
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: var(--color-gray-600);
}

/* Code inline */
:deep(.ProseMirror code) {
  background: var(--color-gray-200);
  color: var(--color-gray-800);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace;
}

/* Bloc de code (codeBlock) */
:deep(.ProseMirror pre) {
  background: var(--color-gray-900); /* Fond sombre dans tous les thèmes */
  color: var(--color-gray-100); /* Texte clair */
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.5;
  border: 1px solid var(--color-gray-700);
  position: relative;
}

/* Code à l'intérieur du bloc */
:deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

/* Syntax highlighting basique (optionnel mais très utile) */
:deep(.ProseMirror pre code .token.keyword),
:deep(.ProseMirror pre code .token.operator) {
  color: #ff79c6;
}
:deep(.ProseMirror pre code .token.string) {
  color: #f1fa8c;
}
:deep(.ProseMirror pre code .token.comment) {
  color: #6272a4;
}
:deep(.ProseMirror pre code .token.function) {
  color: #8be9fd;
}
:deep(.ProseMirror pre code .token.number) {
  color: #bd93f9;
}

/* Lien */
:deep(.ProseMirror a) {
  color: var(--color-primary-500);
  text-decoration: underline;
  cursor: pointer;
}

:deep(.ProseMirror a:hover) {
  color: var(--color-primary-600);
}

/* Image */
:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

/* Ligne horizontale */
:deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid var(--color-gray-300);
  margin: 2rem 0;
}
</style>
