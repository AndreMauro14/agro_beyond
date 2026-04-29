import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { CheckCircle2, Loader2, Smartphone, WifiOff } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { useWhatsappStatus } from "@/presentation/hooks/useWhatsappStatus";
import { cn } from "@/presentation/utils/cn";

export default function Conectar() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useWhatsappStatus(2000);

  const status = data?.status ?? "disconnected";
  const qr = data?.qr ?? null;

  useEffect(() => {
    if (status === "connected") {
      const timer = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl rounded-2xl bg-card-elevated p-5 shadow-elevated ring-1 ring-border/40 sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl md:text-4xl">Conectar ao WhatsApp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escaneie o QR code com o WhatsApp do celular para começar a receber as ocorrências.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <StatusBadge status={status} />

          <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl bg-card p-4 ring-1 ring-border/40 sm:p-6">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
            {isError && <p className="px-4 text-center text-sm text-warning">Erro ao consultar o servidor.</p>}
            {!isLoading && !isError && status === "connected" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-14 w-14 text-success" />
                <p className="font-display text-lg font-bold text-success">Conectado</p>
                <p className="text-xs text-muted-foreground">Redirecionando…</p>
              </div>
            )}
            {!isLoading && !isError && status !== "connected" && qr && (
              <div className="h-full w-full">
                <QRCode
                  value={qr}
                  level="M"
                  style={{ height: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                />
              </div>
            )}
            {!isLoading && !isError && status !== "connected" && !qr && (
              <div className="flex flex-col items-center gap-3 px-2 text-center">
                <WifiOff className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aguardando QR code do bot…</p>
                <p className="text-xs text-muted-foreground">
                  Execute <code className="break-all rounded bg-muted px-1 py-0.5 text-[11px]">python python_core/whatsapp_bot.py</code>
                </p>
              </div>
            )}
          </div>

          <ol className="w-full space-y-2 rounded-lg bg-card p-4 text-sm ring-1 ring-border/40">
            <Step n={1} icon={<Smartphone className="h-4 w-4" />}>Abra o WhatsApp no celular</Step>
            <Step n={2}>Vá em <strong>Aparelhos conectados → Conectar um aparelho</strong></Step>
            <Step n={3}>Aponte a câmera para o QR code acima</Step>
          </ol>

          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
            {status === "connected" && (
              <Button onClick={() => navigate("/")}>Ir para o app</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    connected: { label: "Conectado", className: "bg-success-soft text-success", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    pairing: { label: "Aguardando scan", className: "bg-warning-soft text-warning", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    disconnected: { label: "Desconectado", className: "bg-muted text-muted-foreground", icon: <WifiOff className="h-3.5 w-3.5" /> },
  };
  const m = map[status] ?? map.disconnected;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", m.className)}>
      {m.icon}
      {m.label}
    </span>
  );
}

function Step({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</span>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-foreground">{children}</span>
    </li>
  );
}
