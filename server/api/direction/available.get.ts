// server/api/direction/available.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Direction = Tables<"direction">;

export default defineEventHandler(async (event) => {
  const directions = await callApi<Direction[]>(event, "/directions");
  return directions.filter((d) => d.actif);
});
