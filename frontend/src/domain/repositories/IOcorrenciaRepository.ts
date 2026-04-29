import type { Ocorrencia } from "../entities/Ocorrencia";

export interface IOcorrenciaRepository {
  list(): Promise<Ocorrencia[]>;
  getById(id: number): Promise<Ocorrencia | null>;
  updateStatus(id: number, status: string): Promise<boolean>;
  remove(id: number): Promise<boolean>;
}
