// server/api/quiz/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { titre, description, id_cours } = await readBody(event);

  if (!titre || !id_cours) {
    throw createError({
      statusCode: 400,
      message: "Titre et ID du cours sont requis",
    });
  }

  return callApi(event, "/quiz", {
    method: "POST",
    body: { titre, description: description || undefined, id_cours },
  });
});
