// server/api/auth/login.get.ts
// Point d'entrée du flux OIDC Authorization Code : redirige vers la page de
// connexion hébergée par Keycloak. Le mot de passe ne transite jamais par
// notre serveur.
import {
  generatePkce,
  generateState,
  setAuthStateCookie,
} from "~~/server/utils/keycloakAuth";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  // "/" seul ne suffit pas à exclure une redirection hors site : "//evil.com"
  // et "/\evil.com" commencent aussi par "/" mais sont résolus par le
  // navigateur comme des URLs absolues vers un autre domaine (open redirect,
  // exploitable pour du phishing après une vraie connexion Keycloak).
  const redirectTo =
    typeof query.redirect === "string" &&
    /^\/(?!\/|\\)/.test(query.redirect)
      ? query.redirect
      : "/";

  const { verifier, challenge } = generatePkce();
  const state = generateState();

  setAuthStateCookie(event, {
    state,
    code_verifier: verifier,
    redirect_to: redirectTo,
  });

  const redirectUri = `${getRequestURL(event).origin}/api/auth/callback`;

  const authorizeUrl = new URL(
    `${config.keycloakIssuer}/protocol/openid-connect/auth`
  );
  authorizeUrl.searchParams.set("client_id", config.keycloakAdminClientId as string);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  // Force le formulaire Keycloak à chaque connexion, ignore toute session SSO
  // existante — évite qu'une session déjà active (autre compte, console
  // Keycloak, autre onglet) réauthentifie silencieusement le mauvais agent.
  authorizeUrl.searchParams.set("prompt", "login");

  return sendRedirect(event, authorizeUrl.toString());
});
