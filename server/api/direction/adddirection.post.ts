// server/api/direction/adddirection.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { designation, id_autorite, actif } = await readBody(event);

  if (!designation || !id_autorite) {
    throw createError({
      statusCode: 400,
      message: "Désignation et autorité supérieure sont requis",
    });
  }

  return callApi(event, "/directions", {
    method: "POST",
    body: { designation, id_autorite, actif: actif ?? true },
  });
});
