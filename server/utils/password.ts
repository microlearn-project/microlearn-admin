// server/utils/password.ts
import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hashe un mot de passe avec SHA-256 et un salt
 * Format stocké: salt:hash (en hex)
 *
 * Note: Pour une application de production, utiliser bcrypt ou argon2
 * Mais SHA-256 avec salt est acceptable pour un prototype
 */
export function hashPassword(password: string): string {
  // Générer un salt aléatoire de 16 bytes
  const salt = randomBytes(16).toString("hex");

  // Hasher le mot de passe avec le salt
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");

  // Retourner salt:hash
  return `${salt}:${hash}`;
}

/**
 * Vérifie si un mot de passe correspond au hash stocké
 * @param password Mot de passe en clair
 * @param storedHash Hash stocké (format salt:hash)
 * @returns true si le mot de passe est correct
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");

    if (!salt || !originalHash) {
      return false;
    }

    // Recalculer le hash avec le même salt
    const hash = createHash("sha256")
      .update(salt + password)
      .digest("hex");

    // Comparaison sécurisée contre les attaques timing
    const originalBuffer = Buffer.from(originalHash, "hex");
    const hashBuffer = Buffer.from(hash, "hex");

    if (originalBuffer.length !== hashBuffer.length) {
      return false;
    }

    return timingSafeEqual(originalBuffer, hashBuffer);
  } catch {
    return false;
  }
}
