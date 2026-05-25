import type { AuthResponse, Usuario } from "@/domain/entities/Usuario";

export interface IAuthRepository {
  login(email: string, senha: string): Promise<AuthResponse>;
  register(email: string, senha: string, nome?: string): Promise<AuthResponse>;
  me(): Promise<Usuario>;
  requestVincularWhatsapp(telefone: string): Promise<{ telefone: string; expira_em_segundos: number }>;
  verifyVincularWhatsapp(telefone: string, codigo: string): Promise<{ telefone_whatsapp: string }>;
}
