// server/api/module/departements/remove.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id_module, id_departement } = await readBody(event);

  if (!id_module || !id_departement) {
    throw createError({
      statusCode: 400,
      message: "ID du module et ID du département requis",
    });
  }

  await callApi(event, `/modules/${id_module}/departements/${id_departement}`, {
    method: "DELETE",
  });
  return { success: true };
});
