// server/api/user-role/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type UserRoleUpdate = TablesUpdate<"user_role">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, date_from, date_to, valide } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de l'attribution requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Construire le payload
  const payload: UserRoleUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (date_from !== undefined) {
    payload.date_from = date_from;
  }

  if (date_to !== undefined) {
    payload.date_to = date_to;
  }

  if (valide !== undefined) {
    payload.valide = valide;
  }

  const { data, error } = await supabase
    .from("user_role")
    .update(payload)
    .eq("id_user_role", id)
    .select(
      `
      *,
      agent:id_agent (
        id_agent,
        code_agent,
        nom,
        prenom,
        email
      ),
      role:id_role (
        id_role,
        designation
      ),
      granter:granted_by (
        id_agent,
        nom,
        prenom
      )
    `
    )
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
