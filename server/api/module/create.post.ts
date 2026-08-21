// server/api/module/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";
import { requireSession } from "~~/server/utils/keycloakAuth";
import { processImagesInDescription } from "~~/server/utils/inlineImages";

export default defineEventHandler(async (event) => {
  const { titre, description } = await readBody(event);

  if (!titre || !description) {
    throw createError({
      statusCode: 400,
      message: "Tous les champs sont requis",
    });
  }

  // L'auteur est l'utilisateur authentifié — jamais le client.
  const { id_agent } = requireSession(event);

  // duree_lecture omis : l'API démarre le module à "0 min", recalculée
  // automatiquement dès qu'un cours y est ajouté (étape 2).
  const newModule = await callApi<{ id_module: string }>(event, "/modules", {
    method: "POST",
    body: { titre, description: "", id_agent },
  });

  const processedDescription = await processImagesInDescription(
    event,
    description,
    "module-images"
  );

  try {
    return await callApi(event, `/modules/${newModule.id_module}`, {
      method: "PATCH",
      body: { description: processedDescription },
    });
  } catch {
    return { ...newModule, description };
  }
});
