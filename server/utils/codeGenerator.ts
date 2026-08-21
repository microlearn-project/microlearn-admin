// server/utils/codeGenerator.ts

/**
 * Caractères base62 pour la génération de codes
 * 0-9, a-z, A-Z = 62 caractères
 */
const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Génère un code aléatoire en base62
 * @param length Longueur du code (par défaut 6)
 * @returns Code aléatoire non prévisible
 */
export function generateBase62Code(length: number = 6): string {
  let code = "";

  // Utiliser crypto pour une génération cryptographiquement sécurisée
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < length; i++) {
    // Mapper chaque byte sur l'alphabet base62
    const index = randomBytes[i]! % BASE62_CHARS.length;
    code += BASE62_CHARS[index];
  }

  return code;
}
