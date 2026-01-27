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
    const index = randomBytes[i] % BASE62_CHARS.length;
    code += BASE62_CHARS[index];
  }

  return code;
}

/**
 * Génère un code agent unique en vérifiant l'unicité en base de données
 * @param supabase Client Supabase
 * @param maxAttempts Nombre maximum de tentatives (par défaut 10)
 * @returns Code unique garanti
 */
export async function generateUniqueAgentCode(
  supabase: ReturnType<typeof import("./supabase").createSupabaseServerClient>,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateBase62Code(6);

    // Vérifier si le code existe déjà
    const { data, error } = await supabase
      .from("agent")
      .select("id_agent")
      .eq("code_agent", code)
      .maybeSingle();

    if (error) {
      // En cas d'erreur de requête, on réessaie
      continue;
    }

    // Si pas de résultat, le code est unique
    if (!data) {
      return code;
    }
  }

  // Si après maxAttempts on n'a pas trouvé de code unique, lever une erreur
  throw new Error(
    "Impossible de générer un code agent unique après plusieurs tentatives"
  );
}
