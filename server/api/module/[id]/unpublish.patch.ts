// server/api/module/[id]/unpublish.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({ statusCode: 400, message: "Missing module ID" });
  }

  return callApi(event, `/modules/${id}/unpublish`, { method: "PATCH" });
});
