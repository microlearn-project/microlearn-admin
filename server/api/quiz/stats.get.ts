// server/api/quiz/stats.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const query = getQuery(event);

  return callApi(event, "/quiz/stats", {
    query: {
      service: (query.service as string) || undefined,
      start: (query.start as string) || undefined,
      end: (query.end as string) || undefined,
      status: (query.status as string) || undefined,
      agent: (query.agent as string) || undefined,
    },
  });
});
