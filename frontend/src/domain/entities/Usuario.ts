export interface Usuario {
  id: number;
  email: string;
  nome?: string | null;
  telefone_whatsapp?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}
