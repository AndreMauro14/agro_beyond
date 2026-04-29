import type { IOcorrenciaRepository } from "@/domain/repositories/IOcorrenciaRepository";
import type { Ocorrencia } from "@/domain/entities/Ocorrencia";

export class GetOcorrencia {
  constructor(private readonly repo: IOcorrenciaRepository) {}

  execute(id: number): Promise<Ocorrencia | null> {
    return this.repo.getById(id);
  }
}
