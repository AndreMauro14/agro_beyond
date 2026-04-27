export type WhatsappConnectionStatus = "disconnected" | "pairing" | "connected";

export interface WhatsappStatus {
  status: WhatsappConnectionStatus;
  qr: string | null;
  pair_code: string | null;
  pair_code_phone: string | null;
  updated_at: number | null;
}
