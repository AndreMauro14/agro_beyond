import type { Gasto } from "./Gasto";

export type OcorrenciaStatus = "pendente" | "em_andamento" | "resolvida" | string;

export interface Ocorrencia {
  id: number;
  telefone: string;
  descricao: string;
  foto_url: string | null;
  setor: string | null;
  data_criacao: string;
  status: OcorrenciaStatus;
  gastos?: Gasto[];
}
