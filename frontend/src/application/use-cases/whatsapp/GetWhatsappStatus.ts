import type { IWhatsappRepository } from "@/domain/repositories/IWhatsappRepository";
import type { WhatsappStatus } from "@/domain/entities/WhatsappStatus";

export class GetWhatsappStatus {
  constructor(private readonly repo: IWhatsappRepository) {}

  execute(): Promise<WhatsappStatus> {
    return this.repo.getStatus();
  }
}
