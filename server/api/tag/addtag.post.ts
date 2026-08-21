// server/api/tag/addtag.post.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);

  return callApi(event, "/tags", {
    method: "POST",
    body: { designation },
  });
});
