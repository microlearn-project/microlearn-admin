// server/api/departement/[id]/deactivate.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du département manquant",
    });
  }

  return callApi(event, `/departements/${id}`, {
    method: "PATCH",
    body: { actif: false },
  });
});
