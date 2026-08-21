// server/api/cours/video-delete.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { urls } = body as { urls: string[] };

  if (!urls || urls.length === 0) {
    throw createError({
      statusCode: 400,
      message: "URLs requises",
    });
  }

  const result = await callApi<{ success: boolean; deleted: number }>(
    event,
    "/storage/files",
    { method: "DELETE", body: { bucket: "cours-videos", urls } }
  );

  return result;
});
