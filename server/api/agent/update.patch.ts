// server/api/agent/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, nom, prenom, email, id_direction, id_departement } =
    await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'agent requis",
    });
  }

  return callApi(event, `/agents/${id}`, {
    method: "PATCH",
    body: { nom, prenom, email, id_direction, id_departement },
  });
});
