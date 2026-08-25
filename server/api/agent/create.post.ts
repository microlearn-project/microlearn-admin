// server/api/agent/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";
import { generateBase62Code } from "~~/server/utils/codeGenerator";

const MAX_CODE_ATTEMPTS = 10;

export default defineEventHandler(async (event) => {
  const { nom, prenom, email, id_direction, id_departement, actif } =
    await readBody(event);

  if (!nom || !prenom || !email || !id_direction || !id_departement) {
    throw createError({
      statusCode: 400,
      message: "Nom, prénom, email, direction et département sont requis",
    });
  }

  // L'API exige un code_agent en entrée (utile pour d'autres appelants) —
  // ici on le génère et on retente sur collision, comme le faisait
  // generateUniqueAgentCode() côté Nuxt avant la migration.
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code_agent = generateBase62Code(6);
    try {
      return await callApi(event, "/agents", {
        method: "POST",
        body: {
          code_agent,
          nom,
          prenom,
          email,
          id_direction,
          id_departement,
          actif,
        },
      });
    } catch (err: any) {
      lastError = err;
      if (err?.statusCode !== 409) throw err;
      // 409 : l'API distingue maintenant la collision email de la collision
      // code_agent dans son message (voir AgentsService.conflictMessageFor
      // côté API) — une collision d'email ne se résoudra jamais en
      // réessayant avec un nouveau code, inutile de gâcher les tentatives.
      const message: string = err?.statusMessage ?? "";
      if (message.toLowerCase().includes("email")) {
        throw err;
      }
    }
  }
  throw lastError;
});
