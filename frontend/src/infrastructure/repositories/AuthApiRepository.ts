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
}

export const authRepository = new AuthApiRepository();
