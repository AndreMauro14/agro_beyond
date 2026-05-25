import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authRepository } from "@/infrastructure/repositories/AuthApiRepository";
import { getAuthToken, setAuthToken, setUnauthorizedHandler } from "@/infrastructure/http/api-client";
import type { Usuario } from "@/domain/entities/Usuario";

interface AuthContextValue {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (email: string, senha: string, nome?: string) => Promise<void>;
  logout: () => void;
  refreshUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsuario = useCallback(async () => {
    if (!getAuthToken()) {
      setUsuario(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await authRepository.me();
      setUsuario(u);
    } catch {
      setAuthToken(null);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUsuario(null));
    refreshUsuario();
    return () => setUnauthorizedHandler(null);
  }, [refreshUsuario]);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await authRepository.login(email, senha);
    setAuthToken(res.access_token);
    setUsuario(res.usuario);
  }, []);

  const register = useCallback(async (email: string, senha: string, nome?: string) => {
    const res = await authRepository.register(email, senha, nome);
    setAuthToken(res.access_token);
    setUsuario(res.usuario);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        isAuthenticated: !!usuario,
        login,
        register,
        logout,
        refreshUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
