export interface Ganho {
  id: number;
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  data_criacao: string;
}

export interface NovoGanho {
  descricao: string;
  categoria?: string | null;
  valor: number;
  data?: string;
}

export interface RelatorioGanhosPorMes {
  mes: string;
  total: number;
}
