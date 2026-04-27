import type {
  IGastoRepository, CreateGastoInput, UpdateGastoInput,
} from "@/domain/repositories/IGastoRepository";
import type {
  Gasto, RelatorioPorSetor, RelatorioPorProduto, RelatorioPorMes,
} from "@/domain/entities/Gasto";
import { httpClient } from "@/infrastructure/http/api-client";

export class GastoApiRepository implements IGastoRepository {
  list(): Promise<Gasto[]> {
    return httpClient.get<Gasto[]>("/gastos");
  }

  async create(data: CreateGastoInput): Promise<number | null> {
    const res = await httpClient.post<{ success: boolean; id: number }>("/gastos", data);
    return res?.id ?? null;
  }

  async update(id: number, data: UpdateGastoInput): Promise<boolean> {
    const res = await httpClient.patch<{ success: boolean }>(`/gastos/${id}`, data);
    return !!res?.success;
  }

  async aprovar(id: number): Promise<boolean> {
    const res = await httpClient.patch<{ success: boolean }>(`/gastos/${id}/aprovar`);
    return !!res?.success;
  }

  async reprovar(id: number): Promise<boolean> {
    const res = await httpClient.patch<{ success: boolean }>(`/gastos/${id}/reprovar`);
    return !!res?.success;
  }

  async remove(id: number): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/gastos/${id}`);
    return !!res?.success;
  }

  async getTotalAprovado(): Promise<number> {
    const res = await httpClient.get<{ total_gastos: number }>("/relatorios/total");
    return res?.total_gastos ?? 0;
  }

  getPorSetor(): Promise<RelatorioPorSetor[]> {
    return httpClient.get<RelatorioPorSetor[]>("/relatorios/por-setor");
  }

  getPorProduto(limit = 5): Promise<RelatorioPorProduto[]> {
    return httpClient.get<RelatorioPorProduto[]>(`/relatorios/por-produto?limit=${limit}`);
  }

  getPorMes(meses = 6): Promise<RelatorioPorMes[]> {
    return httpClient.get<RelatorioPorMes[]>(`/relatorios/por-mes?meses=${meses}`);
  }
}
