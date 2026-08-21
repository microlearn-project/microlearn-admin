// server/api/tag/updatetag.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, designation } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du tag requis" });
  }

  return callApi(event, `/tags/${id}`, {
    method: "PATCH",
    body: { designation },
  });
});
