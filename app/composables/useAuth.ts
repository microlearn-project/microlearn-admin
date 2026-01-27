// composables/useAuth.ts
import type { SessionUser } from "~~/server/utils/session";

interface AuthState {
  authenticated: boolean;
  user: SessionUser | null;
  loggedInAt: string | null;
  expiresAt: string | null;
}

export const useAuth = () => {
  const user = useState<SessionUser | null>("auth_user", () => null);
  const authenticated = useState<boolean>("auth_authenticated", () => false);
  const loading = useState<boolean>("auth_loading", () => true);

  /**
   * Récupère la session courante
   */
  async function fetchUser(): Promise<void> {
    loading.value = true;

    try {
      const data = await $fetch<AuthState>("/api/auth/me");
      authenticated.value = data.authenticated;
      user.value = data.user;
    } catch {
      authenticated.value = false;
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Connexion
   */
  async function login(
    identifier: string,
    password: string,
    loginType: "email" | "code"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await $fetch<{ success: boolean; user: SessionUser }>(
        "/api/auth/login",
        {
          method: "POST",
          body: { identifier, password, loginType },
        }
      );

      authenticated.value = true;
      user.value = data.user;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.data?.statusMessage || "Erreur de connexion",
      };
    }
  }

  /**
   * Déconnexion
   */
  async function logout(): Promise<void> {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } finally {
      authenticated.value = false;
      user.value = null;
      navigateTo("/login");
    }
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  function hasRole(roleDesignation: string): boolean {
    return user.value?.role?.designation === roleDesignation;
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles spécifiés
   */
  function hasAnyRole(roles: string[]): boolean {
    if (!user.value?.role) return false;
    return roles.includes(user.value.role.designation);
  }

  return {
    user: readonly(user),
    authenticated: readonly(authenticated),
    loading: readonly(loading),
    fetchUser,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
};
