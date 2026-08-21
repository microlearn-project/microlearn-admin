// server/api/cours/video-signed-url.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { fileName, fileType, fileSize, storagePath } = await readBody(event);

  if (!fileName || !fileType || !storagePath) {
    throw createError({ statusCode: 400, message: "Paramètres manquants" });
  }

  return callApi(event, "/cours/video-signed-url", {
    method: "POST",
    body: { fileName, fileType, fileSize, storagePath },
  });
});
