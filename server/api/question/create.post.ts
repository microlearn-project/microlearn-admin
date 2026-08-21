// server/api/question/create.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { texte, id_quiz, actif } = await readBody(event);

  if (texte === undefined || texte === null || !id_quiz) {
    throw createError({
      statusCode: 400,
      message: "Texte et ID du quiz sont requis",
    });
  }

  return callApi(event, "/questions", {
    method: "POST",
    body: { texte, id_quiz, actif },
  });
});
