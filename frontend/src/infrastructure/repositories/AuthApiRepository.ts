import { httpClient } from "@/infrastructure/http/api-client";
import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { AuthResponse, Usuario } from "@/domain/entities/Usuario";

export class AuthApiRepository implements IAuthRepository {
  login(email: string, senha: string) {
    return httpClient.post<AuthResponse>("/auth/login", { email, senha });
  }

  register(email: string, senha: string, nome?: string) {
    return httpClient.post<AuthResponse>("/auth/register", { email, senha, nome });
  }

  me() {
    return httpClient.get<Usuario>("/auth/me");
  }

  requestVincularWhatsapp(telefone: string) {
    return httpClient.post<{ telefone: string; expira_em_segundos: number }>(
      "/auth/vincular-whatsapp/request",
      { telefone },
    );
  }

  verifyVincularWhatsapp(telefone: string, codigo: string) {
    return httpClient.post<{ telefone_whatsapp: string }>(
      "/auth/vincular-whatsapp/verify",
      { telefone, codigo },
    );
  }
}

export const authRepository = new AuthApiRepository();
