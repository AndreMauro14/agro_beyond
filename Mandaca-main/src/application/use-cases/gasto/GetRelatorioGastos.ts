import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";
import type {
  RelatorioPorSetor, RelatorioPorProduto, RelatorioPorMes,
} from "@/domain/entities/Gasto";

export class GetRelatorioGastos {
  constructor(private readonly repo: IGastoRepository) {}

  total(): Promise<number> {
    return this.repo.getTotalAprovado();
  }

  porSetor(): Promise<RelatorioPorSetor[]> {
    return this.repo.getPorSetor();
  }

  porProduto(limit = 5): Promise<RelatorioPorProduto[]> {
    return this.repo.getPorProduto(limit);
  }

  porMes(meses = 6): Promise<RelatorioPorMes[]> {
    return this.repo.getPorMes(meses);
  }
}
