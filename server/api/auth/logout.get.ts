// server/api/auth/logout.get.ts
// Déconnexion globale : ferme aussi la session Keycloak (SSO), pas
// seulement le cookie local — sinon "Se déconnecter" laisserait l'agent
// toujours connecté côté Keycloak, surprenant s'il rouvre l'admin ensuite.
import { getAuthCookie, clearAuthCookie } from "~~/server/utils/keycloakAuth";

export default defineEventHandler((event) => {
  const session = getAuthCookie(event);
  clearAuthCookie(event);

  if (!session) {
    return sendRedirect(event, "/login");
  }

  const config = useRuntimeConfig();
  const postLogoutRedirectUri = `${getRequestURL(event).origin}/login`;

  const endSessionUrl = new URL(
    `${config.keycloakIssuer}/protocol/openid-connect/logout`
  );
  endSessionUrl.searchParams.set("id_token_hint", session.id_token);
  endSessionUrl.searchParams.set(
    "post_logout_redirect_uri",
    postLogoutRedirectUri
  );

  return sendRedirect(event, endSessionUrl.toString());
});
