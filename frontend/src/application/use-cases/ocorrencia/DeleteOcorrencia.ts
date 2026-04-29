import type { IOcorrenciaRepository } from "@/domain/repositories/IOcorrenciaRepository";

export class DeleteOcorrencia {
  constructor(private readonly repo: IOcorrenciaRepository) {}

  execute(id: number): Promise<boolean> {
    return this.repo.remove(id);
  }
}
