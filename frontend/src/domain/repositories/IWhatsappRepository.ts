import type { WhatsappStatus } from "../entities/WhatsappStatus";

export interface IWhatsappRepository {
  getStatus(): Promise<WhatsappStatus>;
  requestPairCode(phone: string): Promise<{ success: boolean; phone: string }>;
}
