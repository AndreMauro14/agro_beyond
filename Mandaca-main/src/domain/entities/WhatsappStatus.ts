export type WhatsappConnectionStatus = "disconnected" | "pairing" | "connected";

export interface WhatsappStatus {
  status: WhatsappConnectionStatus;
  qr: string | null;
  updated_at: number | null;
}
