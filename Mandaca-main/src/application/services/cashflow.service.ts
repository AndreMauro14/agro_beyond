import type { Gasto } from "@/domain/entities/Gasto";
import type { Ganho } from "@/domain/entities/Ganho";

export type CashflowKind = "ganho" | "gasto";

export interface CashflowEntry {
  id: string;
  kind: CashflowKind;
  originalId: number;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export function ganhoToEntry(g: Ganho): CashflowEntry {
  return {
    id: `ganho-${g.id}`,
    kind: "ganho",
    originalId: g.id,
    date: g.data,
    description: g.descricao,
    category: g.categoria ?? "Outros",
    amount: Number(g.valor),
  };
}

export function gastoToEntry(g: Gasto, setor?: string | null): CashflowEntry {
  return {
    id: `gasto-${g.id}`,
    kind: "gasto",
    originalId: g.id,
    date: typeof g.data_criacao === "string" ? g.data_criacao.slice(0, 10) : g.data_criacao,
    description: g.nome_produto + (g.ocorrencia_descricao ? ` — ${g.ocorrencia_descricao}` : ""),
    category: setor ?? "Outros",
    amount: Number(g.valor_total),
  };
}

export function mergeCashflow(ganhos: Ganho[], gastos: Gasto[], setorPorOcorrencia?: Map<number, string | null>): CashflowEntry[] {
  const entries: CashflowEntry[] = [
    ...ganhos.map(ganhoToEntry),
    ...gastos.map((g) => gastoToEntry(g, setorPorOcorrencia?.get(g.id_ocorrencia) ?? null)),
  ];
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export function summaryFor(entries: CashflowEntry[]) {
  const entradas = entries.filter((e) => e.kind === "ganho").reduce((s, e) => s + e.amount, 0);
  const saidas = entries.filter((e) => e.kind === "gasto").reduce((s, e) => s + e.amount, 0);
  return { entradas, saidas, saldo: entradas - saidas };
}
