// server/api/departement/adddepartement.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { designation, id_direction, actif } = await readBody(event);

  if (!designation || !id_direction) {
    throw createError({
      statusCode: 400,
      message: "Désignation et direction sont requis",
    });
  }

  return callApi(event, "/departements", {
    method: "POST",
    body: { designation, id_direction, actif: actif ?? false },
  });
});
