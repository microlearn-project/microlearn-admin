// server/api/agent/deactivate.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type AgentUpdate = TablesUpdate<"agent">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing agent ID",
    });
  }
  const supabase = createSupabaseServerClient();

  const payload: AgentUpdate = {
    actif: false,
  };

  const { data, error } = await supabase
    .from("agent")
    .update(payload)
    .eq("id_agent", id)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  return data;
});
