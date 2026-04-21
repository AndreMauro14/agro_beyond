import type { WhatsappStatus } from "../entities/WhatsappStatus";

export interface IWhatsappRepository {
  getStatus(): Promise<WhatsappStatus>;
}
