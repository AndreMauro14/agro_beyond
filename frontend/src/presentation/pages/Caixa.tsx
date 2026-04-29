import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Calendar as CalendarIcon, FileDown, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/presentation/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/presentation/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/presentation/components/ui/alert-dialog";
import { Label } from "@/presentation/components/ui/label";
import { formatBRL, formatDateShort } from "@/application/services/format.service";
import { exportCSV, exportPDF } from "@/application/services/export.service";
import { mergeCashflow, summaryFor, type CashflowEntry } from "@/application/services/cashflow.service";
import { useGanhos, useDeleteGanho } from "@/presentation/hooks/useGanhos";
import { useGastos, useDeleteGasto } from "@/presentation/hooks/useGastos";
import { useOcorrencias } from "@/presentation/hooks/useOcorrencias";
import { cn } from "@/presentation/utils/cn";
import { toast } from "sonner";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function Caixa() {
  const ganhos = useGanhos();
  const gastos = useGastos();
  const ocorrencias = useOcorrencias();
  const deleteGanho = useDeleteGanho();
  const deleteGasto = useDeleteGasto();

  const [pendingDelete, setPendingDelete] = useState<CashflowEntry | null>(null);
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [periodOpen, setPeriodOpen] = useState(false);

  const periodLabel = `${MONTH_NAMES[month]} ${year}`;

  const setorPorOcorrencia = useMemo(() => {
    const map = new Map<number, string | null>();
    (ocorrencias.data ?? []).forEach((o) => map.set(o.id, o.setor ?? null));
    return map;
  }, [ocorrencias.data]);

  const allEntries = useMemo(
    () => mergeCashflow(ganhos.data ?? [], gastos.data ?? [], setorPorOcorrencia),
    [ganhos.data, gastos.data, setorPorOcorrencia],
  );

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    allEntries.forEach((e) => ys.add(new Date(e.date).getFullYear()));
    ys.add(now.getFullYear());
    ys.add(year);
    return Array.from(ys).sort((a, b) => b - a);
  }, [allEntries, year]);

  const filtered = useMemo(
    () =>
      allEntries.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }),
    [allEntries, month, year],
  );

  const { entradas, saidas, saldo } = useMemo(() => summaryFor(filtered), [filtered]);
  const maxBar = Math.max(entradas, saidas, 1);

  const summary = { entradas, saidas, saldo, periodo: periodLabel };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      toast.error(`Nenhum lançamento em ${periodLabel} para exportar`);
      return;
    }
    try {
      exportPDF(filtered, summary);
      toast.success("Relatório PDF gerado com sucesso");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error(`Nenhum lançamento em ${periodLabel} para exportar`);
      return;
    }
    try {
      exportCSV(filtered, summary);
      toast.success("CSV exportado com sucesso");
    } catch {
      toast.error("Erro ao gerar CSV");
    }
  };

  const confirmarExclusao = () => {
    if (!pendingDelete) return;
    const mut = pendingDelete.kind === "ganho" ? deleteGanho : deleteGasto;
    mut.mutate(pendingDelete.originalId, {
      onSuccess: () => {
        toast.success("Lançamento excluído");
        setPendingDelete(null);
      },
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  const loading = ganhos.isLoading || gastos.isLoading;

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="border-l-4 border-warning pl-4">
          <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">Controle de Caixa</h1>
          <p className="mt-2 text-muted-foreground">Entradas e saídas consolidadas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card-elevated">
                <CalendarIcon className="h-4 w-4" /> {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mês</Label>
                  <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {MONTH_NAMES.map((name, i) => (
                        <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano</Label>
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => { setPeriodOpen(false); toast.success(`Período: ${MONTH_NAMES[month]} ${year}`); }}>
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <FileDown className="h-4 w-4" /> Exportar Relatório
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                <FileDown className="h-4 w-4 text-warning" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-success" />
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
          <p className="text-sm font-semibold text-foreground">Saldo do Período</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{periodLabel}</p>
          <p className={cn(
            "mt-8 font-display text-4xl font-extrabold",
            saldo >= 0 ? "text-primary" : "text-warning",
          )}>{formatBRL(saldo)}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lançamento registrado" : "lançamentos registrados"}
          </p>
        </div>

        <div className="rounded-lg bg-card-elevated p-6 shadow-card ring-1 ring-border/40 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Entradas vs Saídas</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-6 space-y-5">
            <BarRow label="Entradas" value={entradas} max={maxBar} color="bg-success" valueClass="text-success" />
            <BarRow label="Saídas" value={saidas} max={maxBar} color="bg-warning" valueClass="text-warning" />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Lançamentos do período</h2>

        <div className="mt-4 overflow-hidden rounded-lg bg-card-elevated shadow-card ring-1 ring-border/40">
          <div className="grid grid-cols-[140px_1fr_180px_160px_40px] gap-4 border-b border-border/60 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Data</span>
            <span>Descrição</span>
            <span>Categoria</span>
            <span className="text-right">Valor (R$)</span>
            <span className="sr-only">Ações</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">Nenhum lançamento em {periodLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use "Lançar Transação" pra registrar entradas ou mande uma mensagem no WhatsApp pra registrar gastos.
              </p>
            </div>
          ) : (
            filtered.map((e) => (
              <div
                key={e.id}
                className="group grid grid-cols-[140px_1fr_180px_160px_40px] items-center gap-4 border-b border-border/40 px-6 py-4 last:border-b-0 transition-colors hover:bg-card-soft/50"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "grid h-7 w-7 place-items-center rounded-full",
                    e.kind === "ganho" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                  )}>
                    {e.kind === "ganho" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDateShort(e.date)}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{e.description}</span>
                <span>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    e.kind === "ganho" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                  )}>
                    {e.category}
                  </span>
                </span>
                <span className={cn(
                  "text-right font-display text-base font-bold",
                  e.kind === "ganho" ? "text-success" : "text-warning",
                )}>
                  {formatBRL(e.kind === "ganho" ? e.amount : -e.amount, { withSign: true })}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(e)}
                  aria-label={`Excluir lançamento ${e.description}`}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-warning-soft hover:text-warning focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento{" "}
              <span className="font-medium text-foreground">"{pendingDelete?.description}"</span> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BarRow({ label, value, max, color, valueClass }: { label: string; value: number; max: number; color: string; valueClass: string }) {
  const pct = Math.max(8, (value / max) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("font-display text-base font-bold", valueClass)}>{formatBRL(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
