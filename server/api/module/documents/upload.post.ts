// server/api/module/documents/upload.post.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Document = Tables<"document">;

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "Aucun fichier fourni",
    });
  }

  const fileData = formData.find((item) => item.name === "file");
  const moduleIdData = formData.find((item) => item.name === "id_module");

  if (!fileData || !moduleIdData) {
    throw createError({
      statusCode: 400,
      message: "Fichier ou ID du module manquant",
    });
  }

  const id_module = moduleIdData.data.toString();
  const originalFileName = fileData.filename || `document_${Date.now()}`;

  // Reconstruit un multipart réel pour l'API — readMultipartFormData a déjà
  // consommé celui de la requête d'origine.
  const upstreamForm = new FormData();
  upstreamForm.append(
    "file",
    new Blob([new Uint8Array(fileData.data)], { type: fileData.type }),
    originalFileName
  );
  upstreamForm.append("id_module", id_module);
  upstreamForm.append("nom_original", originalFileName);

  return callApi<Document>(event, "/documents/upload", {
    method: "POST",
    body: upstreamForm,
  });
});
