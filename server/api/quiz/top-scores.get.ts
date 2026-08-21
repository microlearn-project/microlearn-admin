// server/api/quiz/top-scores.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const query = getQuery(event);

  return callApi(event, "/quiz/top-scores", {
    query: {
      service: (query.service as string) || undefined,
      start: (query.start as string) || undefined,
      end: (query.end as string) || undefined,
    },
  });
});
