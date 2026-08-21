// server/api/role/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Role = Tables<"role">;

export default defineEventHandler((event) => {
  return callApi<Role[]>(event, "/roles");
});
