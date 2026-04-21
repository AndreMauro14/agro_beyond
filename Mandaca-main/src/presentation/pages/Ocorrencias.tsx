import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, Phone, Receipt, XCircle } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { useOcorrencias, useUpdateOcorrenciaStatus } from "@/presentation/hooks/useOcorrencias";
import { useAprovarGasto, useReprovarGasto, useRelatorioTotal } from "@/presentation/hooks/useGastos";
import { formatBRL, formatDateShort } from "@/application/services/format.service";
import { cn } from "@/presentation/utils/cn";
import { toast } from "sonner";
import type { Ocorrencia } from "@/domain/entities/Ocorrencia";

const STATUS_LABEL: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", className: "bg-warning-soft text-warning", icon: <Clock className="h-3 w-3" /> },
  em_andamento: { label: "Em andamento", className: "bg-primary/10 text-primary", icon: <AlertTriangle className="h-3 w-3" /> },
  resolvida: { label: "Resolvida", className: "bg-success-soft text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function Ocorrencias() {
  const { data: ocorrencias, isLoading, isError, refetch } = useOcorrencias();
  const { data: totalAprovado } = useRelatorioTotal();
  const updateStatus = useUpdateOcorrenciaStatus();
  const aprovar = useAprovarGasto();
  const reprovar = useReprovarGasto();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const filtradas = useMemo(() => {
    if (!ocorrencias) return [];
    if (filtroStatus === "todos") return ocorrencias;
    return ocorrencias.filter((o) => (o.status ?? "pendente") === filtroStatus);
  }, [ocorrencias, filtroStatus]);

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

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="border-l-4 border-warning pl-4">
          <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">Ocorrências WhatsApp</h1>
          <p className="mt-2 text-muted-foreground">Mensagens recebidas e analisadas pelo Manda Cá</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="resolvida">Resolvidas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Total de ocorrências" value={ocorrencias?.length ?? 0} icon={<MessageCircle className="h-4 w-4" />} />
        <StatCard
          label="Pendentes"
          value={ocorrencias?.filter((o) => (o.status ?? "pendente") === "pendente").length ?? 0}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Gastos aprovados"
          value={totalAprovado !== undefined ? formatBRL(totalAprovado) : "—"}
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-primary">Registros</h2>

        {isLoading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="mt-4 rounded-lg bg-warning-soft p-6 text-warning">
            Erro ao carregar ocorrências. Verifique se a API está rodando em <code>{import.meta.env.VITE_API_URL ?? "http://localhost:8000"}</code>.
          </div>
        )}

        {!isLoading && !isError && filtradas.length === 0 && (
          <div className="mt-4 rounded-lg bg-card-elevated p-10 text-center shadow-card ring-1 ring-border/40">
            <p className="text-sm font-medium text-foreground">Nenhuma ocorrência no filtro atual</p>
            <p className="mt-1 text-xs text-muted-foreground">Envie uma mensagem no WhatsApp conectado para criar novos registros.</p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {filtradas.map((o) => (
            <OcorrenciaCard
              key={o.id}
              ocorrencia={o}
              onStatusChange={handleStatus}
              onAprovarGasto={handleAprovarGasto}
              onReprovarGasto={handleReprovarGasto}
            />
          ))}
        </div>
      </section>
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
}

function OcorrenciaCard({ ocorrencia, onStatusChange, onAprovarGasto, onReprovarGasto }: OcorrenciaCardProps) {
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

          <p className="mt-3 text-sm text-foreground">{ocorrencia.descricao}</p>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {ocorrencia.telefone}
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
          <Select value={status} onValueChange={(v) => onStatusChange(ocorrencia.id, v)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="resolvida">Resolvida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </article>
  );
}
