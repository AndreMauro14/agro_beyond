import type { Ganho, NovoGanho, RelatorioGanhosPorMes } from "../entities/Ganho";

export interface IGanhoRepository {
  list(): Promise<Ganho[]>;
  create(data: NovoGanho): Promise<number | null>;
  remove(id: number): Promise<boolean>;
  getPorMes(meses?: number): Promise<RelatorioGanhosPorMes[]>;
}
