// app/utils/fileValidation.ts

/**
 * Vérifie si un nom de fichier contient des caractères invalides
 */
export function hasInvalidCharacters(fileName: string): boolean {
  // Accents
  const hasAccents = /[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/.test(fileName);

  // Espaces
  const hasSpaces = /\s/.test(fileName);

  // Caractères spéciaux (tout sauf a-z, 0-9, ., -, _)
  const hasSpecialChars = /[^a-zA-Z0-9._\s-]/.test(
    fileName.replace(/[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g, "")
  );

  return hasAccents || hasSpaces || hasSpecialChars;
}

/**
 * Nettoie un nom de fichier pour le rendre compatible avec Supabase Storage
 */
export function sanitizeFileName(fileName: string): string {
  // 1. Séparer nom et extension
  const lastDotIndex = fileName.lastIndexOf(".");
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

  // 2. Normaliser et supprimer les accents
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 3. Nettoyer les caractères spéciaux
  const cleaned = normalized
    .replace(/\s+/g, "_")              // Espaces → underscores
    .replace(/[^a-zA-Z0-9._-]/g, "")   // Supprimer caractères spéciaux
    .replace(/_{2,}/g, "_")            // Multiples _ → un seul
    .toLowerCase();                    // Tout en minuscules

  return cleaned + extension.toLowerCase();
}

/**
 * Génère un nom de fichier suggéré avec les détails de la transformation
 */
export function getSuggestedFileName(fileName: string): string {
  return sanitizeFileName(fileName);
}
