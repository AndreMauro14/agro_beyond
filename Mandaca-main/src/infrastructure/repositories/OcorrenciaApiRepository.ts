import type { IOcorrenciaRepository } from "@/domain/repositories/IOcorrenciaRepository";
import type { Ocorrencia } from "@/domain/entities/Ocorrencia";
import { httpClient } from "@/infrastructure/http/api-client";

export class OcorrenciaApiRepository implements IOcorrenciaRepository {
  list(): Promise<Ocorrencia[]> {
    return httpClient.get<Ocorrencia[]>("/ocorrencias");
  }

  getById(id: number): Promise<Ocorrencia | null> {
    return httpClient
      .get<Ocorrencia>(`/ocorrencias/${id}`)
      .catch((err) => {
        if (String(err).includes("[404]")) return null;
        throw err;
      });
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    const res = await httpClient.patch<{ success: boolean }>(
      `/ocorrencias/${id}/status`,
      { status },
    );
    return !!res?.success;
  }
}
