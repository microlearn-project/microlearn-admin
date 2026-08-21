// server/api/module/images/upload.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { image, id_module } = body;

  if (!image || !id_module) {
    throw createError({
      statusCode: 400,
      message: "Image et ID du module requis",
    });
  }

  const result = await callApi<{ url: string; path: string }>(
    event,
    "/storage/images",
    {
      method: "POST",
      body: { bucket: "module-images", imageBase64: image },
    }
  );

  return result;
});
