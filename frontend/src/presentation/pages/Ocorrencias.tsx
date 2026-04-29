import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, Pencil, Receipt, Trash2, XCircle } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/presentation/components/ui/alert-dialog";
import { useOcorrencias, useUpdateOcorrenciaStatus, useDeleteOcorrencia } from "@/presentation/hooks/useOcorrencias";
import { useAprovarGasto, useReprovarGasto, useRelatorioTotal, useGastos } from "@/presentation/hooks/useGastos";
import { formatBRL, formatDateShort } from "@/application/services/format.service";
import { cn } from "@/presentation/utils/cn";
import { toast } from "sonner";
import type { Ocorrencia } from "@/domain/entities/Ocorrencia";

const STATUS_LABEL: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", className: "bg-warning-soft text-warning", icon: <Clock className="h-3 w-3" /> },
  em_andamento: { label: "Em andamento", className: "bg-primary/10 text-primary", icon: <AlertTriangle className="h-3 w-3" /> },
  concluida: { label: "Concluída", className: "bg-success-soft text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
  resolvida: { label: "Concluída", className: "bg-success-soft text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const isConcluida = (status: string | null | undefined) =>
  status === "concluida" || status === "resolvida";

// Remove mentions "@123456789" (IDs do WhatsApp) da descrição
const limparDescricao = (texto: string): string =>
  texto.replace(/@\d{6,}/g, "").replace(/\s+/g, " ").trim();

// Label amigável pra origem da ocorrência (esconde JIDs do WhatsApp)
const rotuloOrigem = (telefone: string | null | undefined): { label: string; icon: "edit" | "msg" } => {
  if (!telefone || telefone === "manual") {
    return { label: "Lançamento manual", icon: "edit" };
  }
  return { label: "Via WhatsApp", icon: "msg" };
};

export default function Ocorrencias() {
  const { data: ocorrencias, isLoading, isError, refetch } = useOcorrencias();
  const { data: gastos } = useGastos();
  const { data: totalAprovado } = useRelatorioTotal();
  const updateStatus = useUpdateOcorrenciaStatus();
  const aprovar = useAprovarGasto();
  const reprovar = useReprovarGasto();
  const deleteOc = useDeleteOcorrencia();
  const [pendingDelete, setPendingDelete] = useState<{ id: number; descricao: string } | null>(null);

  const valorPorOcorrencia = useMemo(() => {
    const map = new Map<number, number>();
    (gastos ?? []).forEach((g) => {
      const atual = map.get(g.id_ocorrencia) ?? 0;
      map.set(g.id_ocorrencia, atual + Number(g.valor_total ?? 0));
    });
    return map;
  }, [gastos]);

  const { aFazer, concluidas } = useMemo(() => {
    const af: Ocorrencia[] = [];
    const cc: Ocorrencia[] = [];
    (ocorrencias ?? []).forEach((o) => {
      (isConcluida(o.status) ? cc : af).push(o);
    });
    return { aFazer: af, concluidas: cc };
  }, [ocorrencias]);

  const handleStatus = (id: number, status: string) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success("Status atualizado"),
        onError: () => toast.error("Erro ao atualizar status"),
      },
    );
  };

  const handleAprovarGasto = (id: number) => {
    aprovar.mutate(id, {
      onSuccess: () => toast.success("Gasto aprovado"),
      onError: () => toast.error("Erro ao aprovar gasto"),
    });
  };

  const handleReprovarGasto = (id: number) => {
    reprovar.mutate(id, {
      onSuccess: () => toast.success("Gasto reprovado"),
      onError: () => toast.error("Erro ao reprovar gasto"),
    });
  };

  const confirmarExclusao = () => {
    if (!pendingDelete) return;
    deleteOc.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Ocorrência excluída");
        setPendingDelete(null);
      },
      onError: () => toast.error("Erro ao excluir ocorrência"),
    });
  };

  const pendentesCount = ocorrencias?.filter((o) => (o.status ?? "pendente") === "pendente").length ?? 0;

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="border-l-4 border-warning pl-4">
          <h1 className="font-display text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">Ocorrências</h1>
          <p className="mt-2 text-muted-foreground">Mensagens recebidas pelo Manda Cá</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total" value={ocorrencias?.length ?? 0} icon={<MessageCircle className="h-4 w-4" />} />
        <StatCard label="Pendentes" value={pendentesCount} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Total aprovado" value={totalAprovado !== undefined ? formatBRL(totalAprovado) : "—"} icon={<Receipt className="h-4 w-4" />} />
      </div>

      {isLoading && (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg bg-warning-soft p-6 text-warning">
          Erro ao carregar ocorrências. Verifique se a API está rodando.
        </div>
      )}

      {!isLoading && !isError && (ocorrencias?.length ?? 0) === 0 && (
        <div className="mt-8 rounded-lg bg-card-elevated p-10 text-center shadow-card ring-1 ring-border/40">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-display text-lg font-bold text-primary">Nenhuma ocorrência ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Envie uma mensagem no WhatsApp conectado para registrar.</p>
        </div>
      )}

      {/* A FAZER */}
      {aFazer.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <Clock className="h-5 w-5 text-warning" />
              A fazer
            </h2>
            <span className="text-sm text-muted-foreground">{aFazer.length} {aFazer.length === 1 ? "registro" : "registros"}</span>
          </div>
          <div className="mt-4 space-y-4">
            {aFazer.map((o) => (
              <OcorrenciaCard
                key={o.id}
                ocorrencia={o}
                onStatusChange={handleStatus}
                onAprovarGasto={handleAprovarGasto}
                onReprovarGasto={handleReprovarGasto}
                onDelete={(id, descricao) => setPendingDelete({ id, descricao })}
              />
            ))}
          </div>
        </section>
      )}

      {/* CONCLUÍDAS - TABELA */}
      {concluidas.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Concluídas
            </h2>
            <span className="text-sm text-muted-foreground">{concluidas.length} {concluidas.length === 1 ? "registro" : "registros"}</span>
          </div>

          {/* Desktop: tabela */}
          <div className="mt-4 hidden overflow-hidden rounded-lg bg-card-elevated shadow-card ring-1 ring-border/40 md:block">
            <div className="grid grid-cols-[110px_130px_1fr_120px_170px] gap-4 border-b border-border/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Data</span>
              <span>Categoria</span>
              <span>Descrição</span>
              <span className="text-right">Valor</span>
              <span className="text-right">Ações</span>
            </div>
            {concluidas.map((o) => {
              const valor = valorPorOcorrencia.get(o.id) ?? 0;
              return (
                <div
                  key={o.id}
                  className="group grid grid-cols-[110px_130px_1fr_120px_170px] items-center gap-4 border-b border-border/40 px-6 py-4 text-sm last:border-b-0 transition-colors hover:bg-card-soft/50"
                >
                  <span className="text-muted-foreground">{formatDateShort(o.data_criacao)}</span>
                  <span>
                    {o.setor ? (
                      <Badge variant="outline" className="text-xs">{o.setor}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="truncate font-medium text-foreground" title={limparDescricao(o.descricao)}>
                    {limparDescricao(o.descricao)}
                  </span>
                  <span className={cn("text-right font-display font-bold", valor > 0 ? "text-warning" : "text-muted-foreground")}>
                    {valor > 0 ? formatBRL(valor) : "—"}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <Select
                      value="concluida"
                      onValueChange={(v) => handleStatus(o.id, v)}
                    >
                      <SelectTrigger className="h-8 w-[126px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => setPendingDelete({ id: o.id, descricao: o.descricao })}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-warning-soft hover:text-warning"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: lista compacta */}
          <div className="mt-4 space-y-3 md:hidden">
            {concluidas.map((o) => {
              const valor = valorPorOcorrencia.get(o.id) ?? 0;
              return (
                <div key={o.id} className="rounded-lg bg-card-elevated p-4 shadow-card ring-1 ring-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {o.setor && <Badge variant="outline" className="text-xs">{o.setor}</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDateShort(o.data_criacao)}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{limparDescricao(o.descricao)}</p>
                    </div>
                    <span className={cn("font-display text-base font-bold", valor > 0 ? "text-warning" : "text-muted-foreground")}>
                      {valor > 0 ? formatBRL(valor) : "—"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Select value="concluida" onValueChange={(v) => handleStatus(o.id, v)}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-warning"
                      onClick={() => setPendingDelete({ id: o.id, descricao: o.descricao })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apaga a ocorrência e todos os gastos vinculados, e não pode ser desfeita.
              <br /><br />
              <span className="font-medium text-foreground">"{pendingDelete?.descricao}"</span>
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

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

interface OcorrenciaCardProps {
  ocorrencia: Ocorrencia;
  onStatusChange: (id: number, status: string) => void;
  onAprovarGasto: (id: number) => void;
  onReprovarGasto: (id: number) => void;
  onDelete: (id: number, descricao: string) => void;
}

function OcorrenciaCard({ ocorrencia, onStatusChange, onAprovarGasto, onReprovarGasto, onDelete }: OcorrenciaCardProps) {
  const status = ocorrencia.status ?? "pendente";
  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.pendente;

  return (
    <article className="rounded-lg bg-card-elevated p-6 shadow-card ring-1 ring-border/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", badge.className)}>
              {badge.icon}
              {badge.label}
            </span>
            {ocorrencia.setor && (
              <Badge variant="outline" className="text-xs">
                {ocorrencia.setor}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateShort(ocorrencia.data_criacao)} • #{ocorrencia.id}
            </span>
          </div>

          <p className="mt-3 text-sm text-foreground">{limparDescricao(ocorrencia.descricao)}</p>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {rotuloOrigem(ocorrencia.telefone).icon === "edit"
              ? <Pencil className="h-3 w-3" />
              : <MessageCircle className="h-3 w-3" />}
            {rotuloOrigem(ocorrencia.telefone).label}
          </div>

          {ocorrencia.gastos && ocorrencia.gastos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">Gastos vinculados</p>
              {ocorrencia.gastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-md bg-card p-3 ring-1 ring-border/40">
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.nome_produto}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.quantidade} × {formatBRL(g.valor_unitario)} = {formatBRL(g.valor_total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.status_aprovacao === "pendente" ? (
                      <>
                        <Button size="sm" variant="outline" className="text-success" onClick={() => onAprovarGasto(g.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-warning" onClick={() => onReprovarGasto(g.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={cn(
                          g.status_aprovacao === "aprovado"
                            ? "bg-success-soft text-success"
                            : "bg-warning-soft text-warning",
                        )}
                      >
                        {g.status_aprovacao}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 gap-2 md:w-auto md:flex-col">
          <Select
            value={status === "resolvida" ? "concluida" : status}
            onValueChange={(v) => onStatusChange(ocorrencia.id, v)}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-warning hover:bg-warning-soft md:w-44"
            onClick={() => onDelete(ocorrencia.id, ocorrencia.descricao)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
    </article>
  );
}
