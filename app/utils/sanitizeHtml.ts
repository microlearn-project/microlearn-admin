import DOMPurify from "isomorphic-dompurify";

// Toute description/texte issu de l'éditeur WYSIWYG est du HTML de confiance
// zéro — un FORMATEUR peut y injecter du script, exécuté dans le navigateur
// d'un SUPERADMIN qui prévisualise ensuite (v-html sans passer par ici =
// XSS stocké -> vol de session / actions arbitraires avec les droits de la
// victime). Toujours nettoyer juste avant le rendu, quelle que soit la
// source.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html);
}
