import type {
  Gasto, RelatorioPorSetor, RelatorioPorProduto, RelatorioPorMes,
} from "../entities/Gasto";

export interface IGastoRepository {
  list(): Promise<Gasto[]>;
  aprovar(id: number): Promise<boolean>;
  reprovar(id: number): Promise<boolean>;
  remove(id: number): Promise<boolean>;
  getTotalAprovado(): Promise<number>;
  getPorSetor(): Promise<RelatorioPorSetor[]>;
  getPorProduto(limit?: number): Promise<RelatorioPorProduto[]>;
  getPorMes(meses?: number): Promise<RelatorioPorMes[]>;
}
