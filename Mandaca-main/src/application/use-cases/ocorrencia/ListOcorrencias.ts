import type { IOcorrenciaRepository } from "@/domain/repositories/IOcorrenciaRepository";
import type { Ocorrencia } from "@/domain/entities/Ocorrencia";

export class ListOcorrencias {
  constructor(private readonly repo: IOcorrenciaRepository) {}

  execute(): Promise<Ocorrencia[]> {
    return this.repo.list();
  }
}
