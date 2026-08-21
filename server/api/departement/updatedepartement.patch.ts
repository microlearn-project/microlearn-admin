// server/api/departement/updatedepartement.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, designation, id_direction, actif } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du département requis",
    });
  }

  return callApi(event, `/departements/${id}`, {
    method: "PATCH",
    body: { designation, id_direction, actif },
  });
});
