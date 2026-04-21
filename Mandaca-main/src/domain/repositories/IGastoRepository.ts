import type { Gasto, RelatorioPorSetor } from "../entities/Gasto";

export interface IGastoRepository {
  list(): Promise<Gasto[]>;
  aprovar(id: number): Promise<boolean>;
  reprovar(id: number): Promise<boolean>;
  getTotalAprovado(): Promise<number>;
  getPorSetor(): Promise<RelatorioPorSetor[]>;
}
