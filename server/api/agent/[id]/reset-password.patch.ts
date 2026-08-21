// server/api/agent/[id]/reset-password.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'agent manquant",
    });
  }

  return callApi<{ temporary_password: string }>(
    event,
    `/agents/${id}/reset-password`,
    { method: "PATCH" },
  );
});
