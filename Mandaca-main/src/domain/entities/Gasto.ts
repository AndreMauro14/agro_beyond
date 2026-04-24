export type StatusAprovacao = "pendente" | "aprovado" | "reprovado" | string;

export interface Gasto {
  id: number;
  id_ocorrencia: number;
  nome_produto: string;
  valor_unitario: number;
  quantidade: number;
  valor_total: number;
  data_criacao: string;
  status_aprovacao: StatusAprovacao;
  ocorrencia_descricao?: string;
}

export interface RelatorioPorSetor {
  setor: string | null;
  total: number;
}

export interface RelatorioPorProduto {
  produto: string;
  total: number;
  vezes: number;
}

export interface RelatorioPorMes {
  mes: string;
  total: number;
}
