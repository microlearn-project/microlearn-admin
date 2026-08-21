// server/api/quiz/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, titre, description } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du quiz requis" });
  }

  return callApi(event, `/quiz/${id}`, {
    method: "PATCH",
    // @IsOptional() côté API n'accepte que undefined, pas null : null
    // laisserait passer la validation @IsString échouer.
    body: { titre, description: description === null ? undefined : description },
  });
});
