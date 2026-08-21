// server/api/agent/[id]/activate.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({ statusCode: 400, message: "Missing agent ID" });
  }

  return callApi(event, `/agents/${id}`, {
    method: "PATCH",
    body: { actif: true },
  });
});
