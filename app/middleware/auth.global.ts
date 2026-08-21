// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ["/login"];

  if (publicRoutes.includes(to.path)) return;
  if (import.meta.server) return;

  const { authenticated, loading, fetchUser, user } = useAuth();

  // Vérifier l'auth si nécessaire — le token Keycloak est validé et
  // rafraîchi automatiquement côté serveur à chaque appel (voir
  // server/utils/keycloakAuth.ts), inutile de le revérifier ici.
  if (loading.value || !authenticated.value) {
    await fetchUser();
  }

  if (!authenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`, {
      replace: true,
    });
  }

  // Vérification des permissions par rôle — l'admin est réservé au staff
  // (SUPERADMIN/ADMIN/FORMATEUR). Un compte sans rôle applicatif (ex. un
  // simple "Agent" mobile/apprenant) ne doit jamais accéder au tableau de
  // bord, même si callback.get.ts ne devrait normalement jamais lui avoir
  // ouvert de session — filet de sécurité côté client.
  const role = user.value?.role?.designation;
  const staffRoles = ["SUPERADMIN", "ADMIN", "FORMATEUR"];

  if (!role || !staffRoles.includes(role)) {
    return navigateTo("/api/auth/logout", { external: true, replace: true });
  }

  const formateurForbidden = [
    "/agents",
    "/roles",
    "/permissions",
    "/directions",
    "/departements",
    "/activitylogs",
  ];

  const adminForbidden = ["/roles"];

  if (role === "FORMATEUR") {
    if (formateurForbidden.some((path) => to.path.startsWith(path))) {
      return navigateTo("/", { replace: true });
    }
  }

  if (role === "ADMIN") {
    if (adminForbidden.some((path) => to.path.startsWith(path))) {
      return navigateTo("/", { replace: true });
    }
  }
});
