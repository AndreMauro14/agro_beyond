import type {
  Gasto, RelatorioPorSetor, RelatorioPorProduto, RelatorioPorMes,
} from "../entities/Gasto";

export interface CreateGastoInput {
  id_ocorrencia: number;
  nome_produto: string;
  valor_unitario: number;
  quantidade?: number;
}

export interface UpdateGastoInput {
  nome_produto?: string;
  valor_unitario?: number;
  quantidade?: number;
}

export interface IGastoRepository {
  list(): Promise<Gasto[]>;
  create(data: CreateGastoInput): Promise<number | null>;
  update(id: number, data: UpdateGastoInput): Promise<boolean>;
  aprovar(id: number): Promise<boolean>;
  reprovar(id: number): Promise<boolean>;
  remove(id: number): Promise<boolean>;
  getTotalAprovado(): Promise<number>;
  getPorSetor(): Promise<RelatorioPorSetor[]>;
  getPorProduto(limit?: number): Promise<RelatorioPorProduto[]>;
  getPorMes(meses?: number): Promise<RelatorioPorMes[]>;
}
