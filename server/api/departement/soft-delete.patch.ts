// server/api/departement/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du département requis",
    });
  }

  await callApi(event, `/departements/${id}`, { method: "DELETE" });
  return { success: true };
});
