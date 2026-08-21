// server/api/cours/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";
import { recomputeModuleDuration } from "~~/server/utils/readingTime";
import { extractBucketUrls, removeStorageUrls } from "~~/server/utils/inlineImages";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du cours requis",
    });
  }

  // Récupère la description avant suppression pour nettoyer images et
  // vidéos embarquées — le quiz/questions/réponses liés cascadent déjà
  // automatiquement en base côté API quand le cours est réellement détruit
  // (hard delete).
  const cours = await callApi<{ description: string; id_module: string }>(
    event,
    `/cours/${id}`
  ).catch(() => null);

  const { hard } = await callApi<{ hard: boolean }>(event, `/cours/${id}`, {
    method: "DELETE",
  });

  if (hard && cours?.description) {
    await Promise.all([
      removeStorageUrls(
        event,
        "cours-images",
        extractBucketUrls(cours.description, "cours-images")
      ),
      removeStorageUrls(
        event,
        "cours-videos",
        extractBucketUrls(cours.description, "cours-videos")
      ),
    ]);
  }

  if (cours?.id_module) {
    await recomputeModuleDuration(event, cours.id_module);
  }

  return { success: true, message: "Cours supprimé" };
});
