import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDown, ArrowUp, BarChart3, Calculator, Receipt, Sprout, FlaskConical, Fuel, Wrench,
  Tractor, UsersRound, Package, TrendingDown, TrendingUp, Wallet, MessageCircle,
} from "lucide-react";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { formatBRL, formatBRLCompact } from "@/application/services/format.service";
import {
  useRelatorioTotal, useRelatorioPorSetor, useRelatorioPorProduto, useRelatorioPorMes,
} from "@/presentation/hooks/useGastos";
import { useGanhos, useRelatorioGanhosPorMes } from "@/presentation/hooks/useGanhos";
import { useTransactions } from "@/presentation/contexts/TransactionContext";
import { cn } from "@/presentation/utils/cn";

const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const ICONE_SETOR: Record<string, React.ReactNode> = {
  "Plantação": <Sprout className="h-5 w-5" />,
  "Insumos": <FlaskConical className="h-5 w-5" />,
  "Combustível": <Fuel className="h-5 w-5" />,
  "Manutenção": <Wrench className="h-5 w-5" />,
  "Equipamento": <Tractor className="h-5 w-5" />,
  "Mão de obra": <UsersRound className="h-5 w-5" />,
  "Outros": <Package className="h-5 w-5" />,
};

const CORES_GASTO = ["#e68228", "#c9681f", "#8b4513", "#b24f15", "#6b21a8", "#0ea5e9", "#64748b"];
const CORES_GANHO = ["#2e7d32", "#1c4129", "#15803d", "#16a34a", "#4ade80", "#86efac", "#bbf7d0"];

const Index = () => {
  const { setOpen } = useTransactions();
  const totalGastos = useRelatorioTotal();
  const porSetor = useRelatorioPorSetor();
  const porProduto = useRelatorioPorProduto(5);
  const gastosPorMes = useRelatorioPorMes(6);
  const ganhosPorMes = useRelatorioGanhosPorMes(6);
  const ganhos = useGanhos();

  const totalSaidas = totalGastos.data ?? 0;
  const totalEntradas = useMemo(
    () => (ganhos.data ?? []).reduce((s, g) => s + Number(g.valor), 0),
    [ganhos.data],
  );
  const lucro = totalEntradas - totalSaidas;

  // Onde ganhou: lista cada entrada individual, ordenada do maior pro menor
  const dadosGanhoPorItem = useMemo(
    () => (ganhos.data ?? [])
      .map((g) => ({
        id: g.id,
        descricao: g.descricao,
        categoria: g.categoria ?? "Outros",
        total: Number(g.valor),
      }))
      .sort((a, b) => b.total - a.total),
    [ganhos.data],
  );

  const dadosSetor = useMemo(
    () => (porSetor.data ?? []).map((s) => ({
      setor: s.setor ?? "Outros",
      total: Number(s.total) || 0,
    })),
    [porSetor.data],
  );

  const dadosProduto = useMemo(
    () => (porProduto.data ?? []).map((p) => ({
      produto: p.produto,
      total: Number(p.total) || 0,
    })),
    [porProduto.data],
  );

  const dadosMesComparativo = useMemo(() => {
    const map = new Map<string, { mes: string; entradas: number; saidas: number }>();
    (ganhosPorMes.data ?? []).forEach((g) => {
      const entry = map.get(g.mes) ?? { mes: g.mes, entradas: 0, saidas: 0 };
      entry.entradas = Number(g.total);
      map.set(g.mes, entry);
    });
    (gastosPorMes.data ?? []).forEach((g) => {
      const entry = map.get(g.mes) ?? { mes: g.mes, entradas: 0, saidas: 0 };
      entry.saidas = Number(g.total);
      map.set(g.mes, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map((e) => {
        const [ano, mes] = e.mes.split("-");
        return {
          label: `${MESES_PT[parseInt(mes, 10) - 1]}/${ano.slice(2)}`,
          entradas: e.entradas,
          saidas: e.saidas,
        };
      });
  }, [ganhosPorMes.data, gastosPorMes.data]);

  const temDados = dadosSetor.length > 0 || dadosProduto.length > 0
    || dadosMesComparativo.length > 0 || dadosGanhoPorItem.length > 0;

  const maxSetor = dadosSetor.length > 0 ? Math.max(...dadosSetor.map((x) => x.total)) : 0;
  const maxGanhoItem = dadosGanhoPorItem.length > 0
    ? Math.max(...dadosGanhoPorItem.map((x) => x.total))
    : 0;

  const loadingAll = totalGastos.isLoading && porSetor.isLoading && ganhos.isLoading;

  return (
    <div className="container py-6 sm:py-10">
      <div className="border-l-4 border-warning pl-4">
        <h1 className="font-display text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
          Seu painel
        </h1>
        <p className="mt-2 text-muted-foreground">
          Entradas, saídas e onde o dinheiro está indo.
        </p>
      </div>

      {/* Cards resumo */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <CardLucro valor={lucro} loading={loadingAll} />
        <CardSimples
          label="Entradas"
          valor={totalEntradas}
          icon={<ArrowDown className="h-5 w-5" />}
          corIcon="bg-success-soft text-success"
          loading={ganhos.isLoading}
        />
        <CardSimples
          label="Saídas"
          valor={totalSaidas}
          icon={<ArrowUp className="h-5 w-5" />}
          corIcon="bg-warning-soft text-warning"
          loading={totalGastos.isLoading}
        />
      </div>

      {!temDados && !loadingAll && (
        <div className="mt-8 rounded-lg bg-card-elevated p-10 text-center shadow-card ring-1 ring-border/40">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-display text-lg font-bold text-primary">Ainda não tem lançamentos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use "Lançar Transação" pra registrar uma entrada, ou mande uma mensagem no WhatsApp pra registrar um gasto.
          </p>
        </div>
      )}

      {/* Onde ganhou dinheiro */}
      {(dadosGanhoPorItem.length > 0 || ganhos.isLoading) && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <TrendingUp className="h-5 w-5 text-success" />
            Onde ganhou dinheiro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Cada entrada registrada</p>
          <div className="mt-4 rounded-lg bg-card-elevated p-4 shadow-card ring-1 ring-border/40 sm:p-6">
            {ganhos.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-3">
                {dadosGanhoPorItem.map((d, i) => (
                  <BarraCategoria
                    key={d.id}
                    label={d.descricao}
                    sublabel={d.categoria}
                    valor={d.total}
                    max={maxGanhoItem}
                    cor={CORES_GANHO[i % CORES_GANHO.length]}
                    corTexto="text-success"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Onde gastou dinheiro */}
      {(dadosSetor.length > 0 || porSetor.isLoading) && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <TrendingDown className="h-5 w-5 text-warning" />
            Onde gastou dinheiro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Saídas por tipo de atividade</p>
          <div className="mt-4 rounded-lg bg-card-elevated p-4 shadow-card ring-1 ring-border/40 sm:p-6">
            {porSetor.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-3">
                {dadosSetor.map((d, i) => (
                  <BarraCategoria
                    key={d.setor}
                    label={d.setor}
                    icon={ICONE_SETOR[d.setor]}
                    valor={d.total}
                    max={maxSetor}
                    cor={CORES_GASTO[i % CORES_GASTO.length]}
                    corTexto="text-warning"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Entradas vs Saídas por mês */}
      {(dadosMesComparativo.length > 0 || gastosPorMes.isLoading || ganhosPorMes.isLoading) && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BarChart3 className="h-5 w-5 text-primary" />
            Entradas vs Saídas por mês
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Últimos 6 meses</p>
          <div className="mt-4 rounded-lg bg-card-elevated p-4 shadow-card ring-1 ring-border/40 sm:p-6">
            {(gastosPorMes.isLoading || ganhosPorMes.isLoading) ? (
              <Skeleton className="h-60 w-full" />
            ) : dadosMesComparativo.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem dados suficientes ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dadosMesComparativo} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis tickFormatter={(v) => formatBRLCompact(Number(v))} fontSize={12} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="entradas" name="Entradas" fill="#2e7d32" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="entradas"
                      position="top"
                      formatter={(v: number) => v > 0 ? formatBRLCompact(Number(v)) : ""}
                      style={{ fontSize: 10, fontWeight: 600, fill: "#2e7d32" }}
                    />
                  </Bar>
                  <Bar dataKey="saidas" name="Saídas" fill="#e68228" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="saidas"
                      position="top"
                      formatter={(v: number) => v > 0 ? formatBRLCompact(Number(v)) : ""}
                      style={{ fontSize: 10, fontWeight: 600, fill: "#c9681f" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      )}

      {/* Top produtos */}
      {(dadosProduto.length > 0 || porProduto.isLoading) && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-primary">O que mais gastou</h2>
          <p className="mt-1 text-sm text-muted-foreground">Produtos que mais consumiram dinheiro</p>
          <div className="mt-4 rounded-lg bg-card-elevated p-4 shadow-card ring-1 ring-border/40 sm:p-6">
            {porProduto.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, dadosProduto.length * 50)}>
                <BarChart data={dadosProduto} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis type="number" tickFormatter={(v) => formatBRLCompact(Number(v))} fontSize={12} />
                  <YAxis type="category" dataKey="produto" width={110} fontSize={13} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="total" fill="#e68228" radius={[0, 6, 6, 0]}>
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={(v: number) => formatBRL(v)}
                      style={{ fontSize: 12, fontWeight: 600, fill: "#1c4129" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      )}

      {/* Ações rápidas */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Ações rápidas</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AcaoRapida
            onClick={() => setOpen(true)}
            icon={<Receipt className="h-5 w-5" />}
            label="Lançar transação"
            cor="bg-warning text-warning-foreground"
          />
          <AcaoLink
            to="/ocorrencias"
            icon={<MessageCircle className="h-5 w-5" />}
            label="Ocorrências"
            cor="bg-primary text-primary-foreground"
          />
          <AcaoLink
            to="/caixa"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Controle de caixa"
            cor="bg-success text-success-foreground"
          />
          <AcaoLink
            to="/calculadora"
            icon={<Calculator className="h-5 w-5" />}
            label="Preço mínimo"
            cor="bg-plum text-primary-foreground"
          />
        </div>
      </section>
    </div>
  );
};

function CardLucro({ valor, loading }: { valor: number; loading: boolean }) {
  const positivo = valor >= 0;
  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-elevated ring-1 ring-border/40 sm:p-8",
      positivo ? "bg-gradient-saldo" : "bg-warning-soft",
    )}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Wallet className="h-4 w-4" />
        {positivo ? "Lucro" : "Prejuízo"}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-12 w-40" />
      ) : (
        <p className={cn(
          "mt-4 font-display text-3xl font-extrabold sm:text-4xl",
          positivo ? "text-primary" : "text-warning",
        )}>
          {formatBRL(valor)}
        </p>
      )}
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        {positivo ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-warning" />}
        Entradas menos saídas
      </p>
    </div>
  );
}

function CardSimples({ label, valor, icon, corIcon, loading }: {
  label: string; valor: number; icon: React.ReactNode; corIcon: string; loading: boolean;
}) {
  return (
    <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
      <div className="flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-md", corIcon)}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-10 w-32" />
      ) : (
        <p className="mt-4 font-display text-3xl font-bold text-foreground">{formatBRL(valor)}</p>
      )}
    </div>
  );
}

function BarraCategoria({ label, sublabel, icon, valor, max, cor, corTexto }: {
  label: string; sublabel?: string; icon?: React.ReactNode; valor: number; max: number; cor: string; corTexto: string;
}) {
  const pct = max > 0 ? Math.max(6, (valor / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
          <span className="truncate">{label}</span>
          {sublabel && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {sublabel}
            </span>
          )}
        </div>
        <span className={cn("shrink-0 font-display text-sm font-bold sm:text-base", corTexto)}>{formatBRL(valor)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
    </div>
  );
}

function AcaoRapida({ onClick, icon, label, cor }: { onClick: () => void; icon: React.ReactNode; label: string; cor: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 rounded-lg bg-card p-5 text-center shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <span className={`grid h-12 w-12 place-items-center rounded-full ${cor}`}>{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

function AcaoLink({ to, icon, label, cor }: { to: string; icon: React.ReactNode; label: string; cor: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-3 rounded-lg bg-card p-5 text-center shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <span className={`grid h-12 w-12 place-items-center rounded-full ${cor}`}>{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}

export default Index;
