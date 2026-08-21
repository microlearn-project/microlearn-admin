// server/api/user-role/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";

interface ApiUserRole {
  id_user_role: string;
  id_agent: string;
  id_role: string;
  granted_by: string | null;
  date_from: string;
  date_to: string | null;
  valide: boolean;
  created_at: string;
  updated_at: string;
  agent_user_role_id_agentToagent: {
    id_agent: string;
    code_agent: string;
    nom: string;
    prenom: string;
    email: string;
    actif: boolean;
  };
  role: { id_role: string; designation: string };
  agent_user_role_granted_byToagent: {
    id_agent: string;
    nom: string;
    prenom: string;
  } | null;
}

export default defineEventHandler(async (event) => {
  const rows = await callApi<ApiUserRole[]>(event, "/user-roles");

  return rows.map((row) => {
    const {
      agent_user_role_id_agentToagent: agent,
      agent_user_role_granted_byToagent: granter,
      ...rest
    } = row;
    return { ...rest, agent, granter };
  });
});
