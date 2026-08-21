// server/api/tag/force-delete.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du tag requis" });
  }

  await callApi(event, `/tags/${id}/force`, { method: "DELETE" });
  return { success: true };
});
