// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicRoutes = ["/login"];

  if (publicRoutes.includes(to.path)) return;
  if (import.meta.server) return;

  const { authenticated, loading, fetchUser, user, logout } = useAuth();

  // Vérifier l'auth si nécessaire
  if (loading.value || !authenticated.value) {
    await fetchUser();
  }

  // Si toujours pas authentifié après fetchUser, rediriger
  if (!authenticated.value) {
    return navigateTo("/login", { replace: true });
  }

  // Validation session UNIQUEMENT si on ne vient PAS de /login
  // ET seulement après un délai pour laisser la session se propager
  if (
    authenticated.value &&
    user.value?.session_token &&
    from.path !== "/login"
  ) {
    try {
      const response = await $fetch<{ valid: boolean }>(
        "/api/auth/validate-session",
        {
          method: "POST",
          body: { session_token: user.value.session_token },
        },
      );

      // Si session invalide, déconnecter
      if (!response.valid) {
        console.warn("Session invalidée par le serveur");
        await logout();
        return;
      }
    } catch (error) {
      // Ne pas déconnecter sur erreur réseau
      // Seulement logger l'erreur
      console.error("Erreur validation session (ignorée):", error);
      // On continue quand même, la session cookie est peut-être encore valide
    }
  }

  // Vérification des permissions par rôle
  const role = user.value?.role?.designation;

  const formateurForbidden = [
    "/agents",
    "/roles",
    "/permissions",
    "/services",
    "/departements",
    "/activity-log",
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
