// server/api/module/publish.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "Missing module ID" });
  }

  return callApi(event, `/modules/${id}/publish`, { method: "PATCH" });
});
