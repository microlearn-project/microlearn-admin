// server/api/auth/me.get.ts
// Le middleware garantit déjà une session valide pour toute route /api/**
// non publique — on se contente de reformer la session locale (déjà connue,
// pas besoin de rappeler l'API) dans la forme attendue par le frontend.
import { requireSession } from "~~/server/utils/keycloakAuth";

export default defineEventHandler((event) => {
  const session = requireSession(event);

  return {
    authenticated: true,
    user: {
      id_agent: session.id_agent,
      code_agent: session.code_agent,
      nom: session.nom,
      prenom: session.prenom,
      email: session.email,
      role: { designation: session.role },
    },
  };
});
