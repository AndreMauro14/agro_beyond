import type { IGanhoRepository } from "@/domain/repositories/IGanhoRepository";
import type { Ganho, NovoGanho, RelatorioGanhosPorMes } from "@/domain/entities/Ganho";
import { httpClient } from "@/infrastructure/http/api-client";

export class GanhoApiRepository implements IGanhoRepository {
  list(): Promise<Ganho[]> {
    return httpClient.get<Ganho[]>("/ganhos");
  }

  async create(data: NovoGanho): Promise<number | null> {
    const res = await httpClient.post<{ success: boolean; id: number }>("/ganhos", data);
    return res?.id ?? null;
  }

  async remove(id: number): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/ganhos/${id}`);
    return !!res?.success;
  }

  getPorMes(meses = 6): Promise<RelatorioGanhosPorMes[]> {
    return httpClient.get<RelatorioGanhosPorMes[]>(`/relatorios/ganhos-por-mes?meses=${meses}`);
  }
}
