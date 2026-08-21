// server/api/activity-log/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";

interface ApiResponse {
  data: unknown[];
  total: number;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const { data, total } = await callApi<ApiResponse>(event, "/activity-log", {
    query: {
      limit,
      offset,
      action: query.action || undefined,
      objet_type: query.objet_type || undefined,
      user_id: query.user_id || undefined,
      from: query.from_date || undefined,
      to: query.to_date || undefined,
      search: query.search || undefined,
    },
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
