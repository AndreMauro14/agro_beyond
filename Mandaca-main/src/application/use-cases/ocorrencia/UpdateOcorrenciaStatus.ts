import type { IOcorrenciaRepository } from "@/domain/repositories/IOcorrenciaRepository";

export class UpdateOcorrenciaStatus {
  constructor(private readonly repo: IOcorrenciaRepository) {}

  execute(id: number, status: string): Promise<boolean> {
    return this.repo.updateStatus(id, status);
  }
}
