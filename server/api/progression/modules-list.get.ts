// server/api/progression/modules-list.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  return callApi(event, "/progression/modules-list");
});
