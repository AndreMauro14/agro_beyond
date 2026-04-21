import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Wallet, Receipt, BarChart3, Calculator, CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "@/presentation/contexts/TransactionContext";
import { formatBRLCompact } from "@/application/services/format.service";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const Index = () => {
  const { transactions, setOpen } = useTransactions();

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const { entradas, saidas, saldo, hasData } = useMemo(() => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const entradas = monthTx.filter((t) => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
    const saidas = monthTx.filter((t) => t.type === "saida").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { entradas, saidas, saldo: entradas - saidas, hasData: monthTx.length > 0 };
  }, [transactions, month, year]);

  const updatedLabel = `Atualizado em ${now.toLocaleDateString("pt-BR")}`;

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">Visão Geral</h1>
          <p className="mt-2 text-muted-foreground">Bem-vindo de volta. Aqui está o resumo da sua safra.</p>
        </div>
        <p className="text-xs uppercase tracking-wider text-warning">{updatedLabel}</p>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {/* Saldo atual destacado */}
        <div className="rounded-lg bg-gradient-saldo p-6 shadow-card ring-1 ring-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo Atual</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-6 font-display text-4xl font-extrabold text-primary">{formatBRLCompact(saldo)}</p>
          <p className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${saldo >= 0 ? "text-success" : "text-warning"}`}>
            {saldo >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {hasData ? `${MONTH_NAMES[month]} de ${year}` : "Sem lançamentos neste mês"}
          </p>
        </div>

        {/* Entradas */}
        <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-success-soft text-success">
              <ArrowDown className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entradas do Mês</span>
          </div>
          <p className="mt-6 font-display text-3xl font-bold text-foreground">{formatBRLCompact(entradas)}</p>
        </div>

        {/* Saídas */}
        <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-warning-soft text-warning">
              <ArrowUp className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saídas do Mês</span>
          </div>
          <p className="mt-6 font-display text-3xl font-bold text-foreground">{formatBRLCompact(saidas)}</p>
        </div>
      </div>

      {/* Two columns */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Ações Rápidas */}
        <section>
          <h2 className="font-display text-xl font-bold text-primary">Ações Rápidas</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col items-center gap-3 rounded-lg bg-card p-5 text-center shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-warning text-warning-foreground">
                <Receipt className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Lançar Despesa</span>
            </button>
            <Link
              to="/caixa"
              className="flex flex-col items-center gap-3 rounded-lg bg-card p-5 text-center shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-success text-success-foreground">
                <BarChart3 className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Ver Fluxo de Caixa</span>
            </Link>
            <Link
              to="/calculadora"
              className="flex flex-col items-center gap-3 rounded-lg bg-card p-5 text-center shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-plum text-primary-foreground">
                <Calculator className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Calc. Preço Mínimo</span>
            </Link>
          </div>
        </section>

        {/* Últimas Transações */}
        <section>
          <h2 className="font-display text-xl font-bold text-primary">Últimas Transações</h2>
          <div className="mt-4 space-y-3 rounded-lg bg-card-elevated p-5 shadow-card ring-1 ring-border/40">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-foreground">Nenhuma transação ainda</p>
                <p className="text-xs text-muted-foreground">Lance sua primeira entrada ou despesa para começar.</p>
              </div>
            ) : (
              transactions.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-md ${
                      t.type === "entrada" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                    }`}
                  >
                    {t.type === "entrada" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                  </div>
                  <span
                    className={`font-display text-sm font-bold ${
                      t.type === "entrada" ? "text-success" : "text-warning"
                    }`}
                  >
                    {formatBRLCompact(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
