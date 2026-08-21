// server/api/direction/updatedirection.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, designation, id_autorite, actif } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la direction requis",
    });
  }

  return callApi(event, `/directions/${id}`, {
    method: "PATCH",
    body: { designation, id_autorite, actif },
  });
});
