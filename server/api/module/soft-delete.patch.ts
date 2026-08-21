// server/api/module/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";
import { extractBucketUrls, removeStorageUrls } from "~~/server/utils/inlineImages";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du module requis",
    });
  }

  // Récupère la description avant suppression pour nettoyer les images
  // embarquées — l'API décide seule soft vs hard delete et nous dit
  // laquelle ; on ne supprime les images que si le module est effectivement
  // détruit (hard delete), un module simplement masqué garde les siennes.
  const current = await callApi<{ description: string | null }>(
    event,
    `/modules/${id}`
  ).catch(() => null);

  const { hard } = await callApi<{ hard: boolean }>(event, `/modules/${id}`, {
    method: "DELETE",
  });

  if (hard && current?.description) {
    const urls = extractBucketUrls(current.description, "module-images");
    await removeStorageUrls(event, "module-images", urls);
  }

  return { success: true };
});
