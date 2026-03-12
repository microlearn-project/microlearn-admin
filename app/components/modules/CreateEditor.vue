<script setup lang="ts">
import type {
  EditorCustomHandlers,
  EditorToolbarItem,
  EditorSuggestionMenuItem,
} from "@nuxt/ui";
import { ImageUpload } from "./editor/ImageUpload";
import { VideoUpload } from "./editor/VideoUpload";
import { TextAlign } from "@tiptap/extension-text-align";

const props = defineProps<{
  moduleId?: string;
  coursId?: string;
}>();

const content = defineModel<string>({ default: "" });

const customHandlers = {
  imageUpload: {
    canExecute: (editor: any) =>
      editor.can().insertContent({ type: "imageUpload" }),
    execute: (editor: any) => {
      editor.chain().focus().insertContent({ type: "imageUpload" }).run();
    },
    isActive: (editor: any) => editor.isActive("imageUpload"),
    isDisabled: undefined,
  },
  videoUpload: {
    canExecute: (editor: any) =>
      editor.can().insertContent({ type: "videoUpload" }),
    execute: (editor: any) => {
      editor.chain().focus().insertContent({
        type: "videoUpload",
        attrs: {
          moduleId: props.moduleId || null,
          coursId: props.coursId || null,
        },
      }).run();
    },
    isActive: (editor: any) => editor.isActive("videoUpload"),
    isDisabled: undefined,
  },
} satisfies EditorCustomHandlers;

const toolbarItems = [
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "Titres" },
      content: { align: "start" },
      items: [
        { kind: "heading", level: 1, icon: "i-lucide-heading-1", label: "Titre 1" },
        { kind: "heading", level: 2, icon: "i-lucide-heading-2", label: "Titre 2" },
        { kind: "heading", level: 3, icon: "i-lucide-heading-3", label: "Titre 3" },
      ],
    },
  ],
  [
    { kind: "mark", mark: "bold",      icon: "i-lucide-bold",          tooltip: { text: "Gras" } },
    { kind: "mark", mark: "italic",    icon: "i-lucide-italic",        tooltip: { text: "Italique" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline",     tooltip: { text: "Souligné" } },
    { kind: "mark", mark: "strike",    icon: "i-lucide-strikethrough", tooltip: { text: "Barré" } },
    { kind: "mark", mark: "code",      icon: "i-lucide-code",          tooltip: { text: "Code inline" } },
  ],
  [
    { kind: "bulletList",  icon: "i-lucide-list",         tooltip: { text: "Liste à puces" } },
    { kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: { text: "Liste numérotée" } },
  ],
  [
    { kind: "blockquote",     icon: "i-lucide-text-quote",          tooltip: { text: "Citation" } },
    { kind: "codeBlock",      icon: "i-lucide-square-code",         tooltip: { text: "Bloc de code" } },
    { kind: "horizontalRule", icon: "i-lucide-separator-horizontal", tooltip: { text: "Séparateur" } },
  ],
  [
    { kind: "link",        icon: "i-lucide-link",  tooltip: { text: "Lien" } },
    { kind: "imageUpload", icon: "i-lucide-image", tooltip: { text: "Image" } },
    { kind: "videoUpload", icon: "i-lucide-video", tooltip: { text: "Vidéo" } },
  ],
  [
    {
      icon: "i-lucide-align-left",
      tooltip: { text: "Alignement" },
      content: { align: "start" },
      items: [
        { kind: "textAlign", align: "left",    icon: "i-lucide-align-left",    label: "Gauche" },
        { kind: "textAlign", align: "center",  icon: "i-lucide-align-center",  label: "Centrer" },
        { kind: "textAlign", align: "right",   icon: "i-lucide-align-right",   label: "Droite" },
        { kind: "textAlign", align: "justify", icon: "i-lucide-align-justify", label: "Justifier" },
      ],
    },
  ],
  [
    { kind: "undo", icon: "i-lucide-undo", tooltip: { text: "Annuler" } },
    { kind: "redo", icon: "i-lucide-redo", tooltip: { text: "Rétablir" } },
  ],
] satisfies EditorToolbarItem<typeof customHandlers>[][];

const bubbleToolbarItems = [
  [
    { kind: "mark", mark: "bold",      icon: "i-lucide-bold",          tooltip: { text: "Gras" } },
    { kind: "mark", mark: "italic",    icon: "i-lucide-italic",        tooltip: { text: "Italique" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline",     tooltip: { text: "Souligné" } },
    { kind: "mark", mark: "strike",    icon: "i-lucide-strikethrough", tooltip: { text: "Barré" } },
    { kind: "mark", mark: "code",      icon: "i-lucide-code",          tooltip: { text: "Code" } },
  ],
  [{ kind: "link", icon: "i-lucide-link", tooltip: { text: "Lien" } }],
  [
    { kind: "textAlign", align: "left",    icon: "i-lucide-align-left",    tooltip: { text: "Gauche" } },
    { kind: "textAlign", align: "center",  icon: "i-lucide-align-center",  tooltip: { text: "Centrer" } },
    { kind: "textAlign", align: "right",   icon: "i-lucide-align-right",   tooltip: { text: "Droite" } },
    { kind: "textAlign", align: "justify", icon: "i-lucide-align-justify", tooltip: { text: "Justifier" } },
  ],
] satisfies EditorToolbarItem[][];

const suggestionItems: EditorSuggestionMenuItem<typeof customHandlers>[][] = [
  [
    { type: "label", label: "Texte" },
    { kind: "paragraph", label: "Paragraphe",  icon: "i-lucide-type" },
    { kind: "heading",   level: 1, label: "Titre 1", icon: "i-lucide-heading-1" },
    { kind: "heading",   level: 2, label: "Titre 2", icon: "i-lucide-heading-2" },
    { kind: "heading",   level: 3, label: "Titre 3", icon: "i-lucide-heading-3" },
  ],
  [
    { type: "label", label: "Listes" },
    { kind: "bulletList",  label: "Liste à puces",   icon: "i-lucide-list" },
    { kind: "orderedList", label: "Liste numérotée", icon: "i-lucide-list-ordered" },
  ],
  [
    { type: "label", label: "Insérer" },
    { kind: "blockquote",     label: "Citation",     icon: "i-lucide-text-quote" },
    { kind: "codeBlock",      label: "Bloc de code", icon: "i-lucide-square-code" },
    { kind: "horizontalRule", label: "Séparateur",   icon: "i-lucide-separator-horizontal" },
    { kind: "imageUpload",    label: "Image",        icon: "i-lucide-image" },
    { kind: "videoUpload",    label: "Vidéo",        icon: "i-lucide-video" },
  ],
];
</script>

<template>
  <div class="relative border border-default rounded-lg overflow-hidden">
    <UEditor
      v-slot="{ editor }"
      v-model="content"
      placeholder="Commencez à écrire la description de votre module..."
      :min-height="500"
      :extensions="[
        ImageUpload,
        VideoUpload,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ]"
      :handlers="customHandlers"
      class="prose prose-neutral dark:prose-invert max-w-none"
    >
      <UEditorToolbar
        :editor="editor"
        :items="toolbarItems"
        class="border-b border-default py-2 px-4 bg-elevated/50 sticky top-0 z-20"
      />
      <UEditorToolbar
        :editor="editor"
        :items="bubbleToolbarItems"
        layout="bubble"
      />
      <UEditorDragHandle :editor="editor" />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
    </UEditor>

    <div
      class="absolute bottom-4 right-4 text-xs text-muted bg-elevated/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-default z-10 pointer-events-none"
    >
      {{ content?.length || 0 }} caractères
    </div>
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  padding: 1.5rem;
  min-height: 500px;
  outline: none;
  background: var(--ui-bg);
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--color-gray-400);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

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

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

:deep(.ProseMirror ul li),
:deep(.ProseMirror ol li) {
  margin: 0.25rem 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--color-primary-500);
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: var(--color-gray-600);
}

:deep(.ProseMirror code) {
  background: var(--color-gray-200);
  color: var(--color-gray-800);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

:deep(.ProseMirror pre) {
  background: var(--color-gray-900);
  color: var(--color-gray-100);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  border: 1px solid var(--color-gray-700);
}

:deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

:deep(.ProseMirror a) {
  color: var(--color-primary-500);
  text-decoration: underline;
  cursor: pointer;
}

:deep(.ProseMirror a:hover) {
  color: var(--color-primary-600);
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: block;
}

:deep(.ProseMirror video) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: block;
}

:deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid var(--color-gray-300);
  margin: 2rem 0;
}
</style>
