import type { IWhatsappRepository } from "@/domain/repositories/IWhatsappRepository";

export class RequestPairCode {
  constructor(private readonly repo: IWhatsappRepository) {}

  execute(phone: string): Promise<{ success: boolean; phone: string }> {
    return this.repo.requestPairCode(phone);
  }
}
