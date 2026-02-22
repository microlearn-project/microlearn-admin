// composables/useAuth.ts
import type { SessionUser } from "~~/server/utils/session";

interface AuthState {
  authenticated: boolean;
  user: SessionUser | null;
  loggedInAt: string | null;
  expiresAt: string | null;
}

interface LoginResponse {
  success: boolean;
  error?: string;
  requiresConfirmation?: boolean;
  message?: string;
  sessionInfo?: any;  
  user?: SessionUser;
}

export const useAuth = () => {
  const user = useState<SessionUser | null>("auth_user", () => null);
  const authenticated = useState<boolean>("auth_authenticated", () => false);
  const loading = useState<boolean>("auth_loading", () => true);

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
   * Connexion avec gestion de session unique
   */
  async function login(
    identifier: string,
    password: string,
    loginType: "email" | "code",
    forceLogin = false,
  ): Promise<LoginResponse> {
    try {
      const data = await $fetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: {
          identifier,
          password,
          loginType,
          forceLogin,
        },
      });

      //  Gestion de la confirmation
      if (data.requiresConfirmation) {
        return {
          success: false,
          requiresConfirmation: true,
          message: data.message,
          sessionInfo: data.sessionInfo,
        };
      }

      if (data.success && data.user) {
        authenticated.value = true;
        user.value = data.user;
        return { success: true };
      }

      return { success: false, error: "Réponse invalide du serveur" };
    } catch (error: any) {
      return {
        success: false,
        error: error?.data?.statusMessage || "Erreur de connexion",
      };
    }
  }

  async function logout(): Promise<void> {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } finally {
      authenticated.value = false;
      user.value = null;
      navigateTo("/login");
    }
  }

  function hasRole(roleDesignation: string): boolean {
    return user.value?.role?.designation === roleDesignation;
  }

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
