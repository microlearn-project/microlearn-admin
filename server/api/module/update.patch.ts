// server/api/module/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";
import {
  processImagesInDescription,
  deleteOrphanedFiles,
} from "~~/server/utils/inlineImages";

export default defineEventHandler(async (event) => {
  const { id, titre, description, duree_lecture } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du module requis",
    });
  }

  let processedDescription = description;
  if (description !== undefined) {
    const currentModule = await callApi<{ description: string | null }>(
      event,
      `/modules/${id}`
    ).catch(() => null);

    processedDescription = await processImagesInDescription(
      event,
      description,
      "module-images"
    );

    await deleteOrphanedFiles(
      event,
      currentModule?.description ?? null,
      processedDescription,
      "module-images"
    );
  }

  return callApi(event, `/modules/${id}`, {
    method: "PATCH",
    body: { titre, description: processedDescription, duree_lecture },
  });
});
