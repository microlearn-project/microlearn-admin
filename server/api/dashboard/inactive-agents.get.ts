// server/api/dashboard/inactive-agents.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/dashboard/inactive-agents");
});
