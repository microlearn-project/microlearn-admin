// server/api/role/addrole.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);

  return callApi(event, "/roles", {
    method: "POST",
    body: { designation },
  });
});
