import type { AuthResponse, Usuario } from "@/domain/entities/Usuario";

export interface IAuthRepository {
  login(email: string, senha: string): Promise<AuthResponse>;
  register(email: string, senha: string, nome?: string): Promise<AuthResponse>;
  me(): Promise<Usuario>;
}
