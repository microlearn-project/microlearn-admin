// server/api/activity-log/stats.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  // Total des logs
  const { count: total } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true });

  // Logs aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: today_count } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Connexions aujourd'hui
  const { count: connexions_today } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .eq("action", "connexion")
    .gte("created_at", today.toISOString());

  // Actions par type (top 5)
  const { data: actions_by_type } = await supabase
    .from("activity_log")
    .select("action")
    .limit(1000);

  // Compter les actions manuellement
  const actionCounts: Record<string, number> = {};
  actions_by_type?.forEach((item) => {
    actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
  });

  const top_actions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: total || 0,
    today: today_count || 0,
    connexions_today: connexions_today || 0,
    top_actions,
  };
});
