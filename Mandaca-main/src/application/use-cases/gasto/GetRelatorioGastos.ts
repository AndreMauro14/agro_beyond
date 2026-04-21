import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";
import type { RelatorioPorSetor } from "@/domain/entities/Gasto";

export class GetRelatorioGastos {
  constructor(private readonly repo: IGastoRepository) {}

  total(): Promise<number> {
    return this.repo.getTotalAprovado();
  }

  porSetor(): Promise<RelatorioPorSetor[]> {
    return this.repo.getPorSetor();
  }
}
