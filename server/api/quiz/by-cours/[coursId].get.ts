// server/api/quiz/by-cours/[coursId].get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const coursId = getRouterParam(event, "coursId");

  if (!coursId) {
    throw createError({
      statusCode: 400,
      message: "ID du cours requis",
    });
  }

  try {
    return await callApi(event, `/quiz/by-cours/${coursId}`);
  } catch (err: any) {
    if (err?.statusCode === 404) return null;
    throw err;
  }
});
