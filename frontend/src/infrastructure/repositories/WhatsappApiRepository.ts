import type { IWhatsappRepository } from "@/domain/repositories/IWhatsappRepository";
import type { WhatsappStatus } from "@/domain/entities/WhatsappStatus";
import { httpClient } from "@/infrastructure/http/api-client";

export class WhatsappApiRepository implements IWhatsappRepository {
  getStatus(): Promise<WhatsappStatus> {
    return httpClient.get<WhatsappStatus>("/whatsapp/status");
  }

  requestPairCode(phone: string): Promise<{ success: boolean; phone: string }> {
    return httpClient.post<{ success: boolean; phone: string }>("/whatsapp/pair-phone", { phone });
  }
}
