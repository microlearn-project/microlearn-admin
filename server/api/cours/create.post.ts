// server/api/cours/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";
import { estimateReadingTime, recomputeModuleDuration } from "~~/server/utils/readingTime";
import { processImagesInDescription } from "~~/server/utils/inlineImages";

export default defineEventHandler(async (event) => {
  const { titre, description, id_module } = await readBody(event);

  if (!titre || !description || !id_module) {
    throw createError({
      statusCode: 400,
      message: "Titre, description et ID du module sont requis",
    });
  }

  // Étape 1 : créer le cours avec description vide pour obtenir un id_cours.
  // ordre omis : l'API l'auto-incrémente pour ce module.
  const newCours = await callApi<{ id_cours: string }>(event, "/cours", {
    method: "POST",
    body: {
      titre,
      description: "",
      duree_lecture: estimateReadingTime(description),
      id_module,
    },
  });

  const processedDescription = await processImagesInDescription(
    event,
    description,
    "cours-images"
  );

  let result: unknown;
  try {
    result = await callApi(event, `/cours/${newCours.id_cours}`, {
      method: "PATCH",
      body: {
        description: processedDescription,
        duree_lecture: estimateReadingTime(processedDescription),
      },
    });
  } catch {
    result = { ...newCours, description };
  }

  await recomputeModuleDuration(event, id_module);
  return result;
});
