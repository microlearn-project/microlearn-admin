// server/api/cours/update.patch.ts
import type { H3Event } from "h3";
import { callApi } from "~~/server/utils/apiBridge";
import { estimateReadingTime, recomputeModuleDuration } from "~~/server/utils/readingTime";
import {
  processImagesInDescription,
  deleteOrphanedFiles,
} from "~~/server/utils/inlineImages";

interface CoursDocumentRow {
  id_document: string;
  document: { fichier: string };
}

// La table cours_document (id_document) a remplacé l'ancienne colonne
// cours.documents (URLs) — DocumentsModal.vue envoie toujours un tableau
// d'URLs complètes, donc on résout chaque URL vers un id_document et on
// réconcilie (ajoute/retire) via les sous-routes, sans toucher au frontend.
async function reconcileDocuments(
  event: H3Event,
  id_cours: string,
  id_module: string,
  desiredUrls: string[]
): Promise<void> {
  const [moduleDocuments, current] = await Promise.all([
    callApi<{ id_document: string; fichier: string }[]>(event, "/documents", {
      query: { module_id: id_module },
    }),
    callApi<CoursDocumentRow[]>(event, `/cours/${id_cours}/documents`),
  ]);

  const idByUrl = new Map(moduleDocuments.map((d) => [d.fichier, d.id_document]));
  const currentByUrl = new Map(
    current.map((row) => [row.document.fichier, row.id_document])
  );

  const desired = new Set(desiredUrls);

  const toRemove = [...currentByUrl.entries()]
    .filter(([url]) => !desired.has(url))
    .map(([, id_document]) => id_document);

  const toAdd = desiredUrls
    .filter((url) => !currentByUrl.has(url))
    .map((url) => idByUrl.get(url))
    .filter((id): id is string => Boolean(id));

  await Promise.all([
    ...toRemove.map((id_document) =>
      callApi(event, `/cours/${id_cours}/documents/${id_document}`, {
        method: "DELETE",
      })
    ),
    ...toAdd.map((id_document) =>
      callApi(event, `/cours/${id_cours}/documents`, {
        method: "POST",
        body: { id_document },
      })
    ),
  ]);
}

export default defineEventHandler(async (event) => {
  const { id, titre, description, documents } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du cours requis" });
  }

  const current = await callApi<{ description: string; id_module: string }>(
    event,
    `/cours/${id}`
  );

  const payload: Record<string, unknown> = {};

  if (titre !== undefined) payload.titre = titre;

  if (description !== undefined) {
    const processedDescription = await processImagesInDescription(
      event,
      description,
      "cours-images"
    );

    await deleteOrphanedFiles(
      event,
      current.description,
      processedDescription,
      "cours-images"
    );
    await deleteOrphanedFiles(
      event,
      current.description,
      processedDescription,
      "cours-videos"
    );

    payload.description = processedDescription;
    payload.duree_lecture = estimateReadingTime(processedDescription);
  }

  const [result] = await Promise.all([
    Object.keys(payload).length > 0
      ? callApi(event, `/cours/${id}`, { method: "PATCH", body: payload })
      : callApi(event, `/cours/${id}`),
    documents !== undefined
      ? reconcileDocuments(event, id, current.id_module, documents)
      : Promise.resolve(),
  ]);

  if (payload.duree_lecture !== undefined) {
    await recomputeModuleDuration(event, current.id_module);
  }

  return result;
});
