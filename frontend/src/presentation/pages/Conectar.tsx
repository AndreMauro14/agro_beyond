import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { Camera, CheckCircle2, KeyRound, Loader2, QrCode, Smartphone, WifiOff } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { useWhatsappStatus, useRequestPairCode } from "@/presentation/hooks/useWhatsappStatus";
import { cn } from "@/presentation/utils/cn";
import { toast } from "sonner";

export default function Conectar() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useWhatsappStatus(2000);
  const requestPair = useRequestPairCode();
  const [phone, setPhone] = useState("");

  const status = data?.status ?? "disconnected";
  const qr = data?.qr ?? null;
  const pairCode = data?.pair_code ?? null;

  useEffect(() => {
    if (status === "connected") {
      const timer = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleRequestPair = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Digite o número completo com DDD (ex: 81 9XXXX-XXXX)");
      return;
    }
    requestPair.mutate(digits, {
      onSuccess: () => toast.success("Solicitando código… aguarde alguns segundos"),
      onError: () => toast.error("Erro ao solicitar código. Tente novamente."),
    });
  };

  const formatPairCode = (code: string) => {
    // Formata "ABCD1234" em "ABCD-1234" pra ler melhor
    const clean = code.replace(/[\s-]/g, "");
    if (clean.length === 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    return clean;
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-xl rounded-2xl bg-card-elevated p-5 shadow-elevated ring-1 ring-border/40 sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-2xl font-extrabold text-primary sm:text-3xl md:text-4xl">Conectar ao WhatsApp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha como conectar: pelo QR code (precisa de outro aparelho com câmera) ou pelo código no próprio celular.
          </p>
        </div>

        <StatusBadge status={status} />

        {status === "connected" ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-xl bg-card p-8 ring-1 ring-border/40">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <p className="font-display text-xl font-bold text-success">Conectado</p>
            <p className="text-sm text-muted-foreground">Redirecionando…</p>
            <Button onClick={() => navigate("/")} className="mt-2">Ir para o app</Button>
          </div>
        ) : (
          <Tabs defaultValue="qr" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Escanear QR</span>
                <span className="sm:hidden">QR Code</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Código no celular</span>
                <span className="sm:hidden">Código</span>
              </TabsTrigger>
            </TabsList>

            {/* === ABA QR === */}
            <TabsContent value="qr" className="mt-6">
              <div className="flex flex-col items-center gap-5 sm:gap-6">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  Aponte a câmera do WhatsApp para o código abaixo
                </p>

                <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl bg-card p-4 ring-1 ring-border/40 sm:p-6">
                  {isLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
                  {isError && <p className="px-4 text-center text-sm text-warning">Erro ao consultar o servidor.</p>}
                  {!isLoading && !isError && qr && (
                    <div className="h-full w-full">
                      <QRCode value={qr} level="M" style={{ height: "100%", width: "100%" }} viewBox="0 0 256 256" />
                    </div>
                  )}
                  {!isLoading && !isError && !qr && (
                    <div className="flex flex-col items-center gap-3 px-2 text-center">
                      <WifiOff className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Aguardando QR code…</p>
                      <p className="text-xs text-muted-foreground">
                        Verifique se o bot está rodando.
                      </p>
                    </div>
                  )}
                </div>

                <ol className="w-full space-y-2 rounded-lg bg-card p-4 text-sm ring-1 ring-border/40">
                  <Step n={1} icon={<Smartphone className="h-4 w-4" />}>Abra o WhatsApp no celular</Step>
                  <Step n={2}>Toque nos <strong>três pontinhos (⋮)</strong> → <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong></Step>
                  <Step n={3}>Aponte a câmera para o QR code acima</Step>
                </ol>
              </div>
            </TabsContent>

            {/* === ABA CÓDIGO === */}
            <TabsContent value="code" className="mt-6">
              <div className="flex flex-col gap-5">
                <p className="text-sm text-muted-foreground">
                  Use esta opção se você só tem um celular. Vamos gerar um código de 8 letras pra você digitar no WhatsApp.
                </p>

                {!pairCode && (
                  <form onSubmit={handleRequestPair} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Número do WhatsApp (com DDD)</Label>
                      <Input
                        id="phone"
                        inputMode="tel"
                        placeholder="81 99999-8888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Sem o "+55", só DDD + número
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={requestPair.isPending}
                    >
                      {requestPair.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Gerar código
                    </Button>
                  </form>
                )}

                {pairCode && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-warning-soft p-6 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-warning">Seu código</p>
                      <p className="mt-3 font-display text-4xl font-extrabold tracking-widest text-warning sm:text-5xl">
                        {formatPairCode(pairCode)}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Válido por ~60 segundos. Solicite um novo se expirar.
                      </p>
                    </div>

                    <ol className="space-y-2 rounded-lg bg-card p-4 text-sm ring-1 ring-border/40">
                      <Step n={1} icon={<Smartphone className="h-4 w-4" />}>Abra o WhatsApp no celular</Step>
                      <Step n={2}>Toque em <strong>⋮</strong> → <strong>Aparelhos conectados</strong></Step>
                      <Step n={3}>Toque em <strong>Conectar um aparelho</strong></Step>
                      <Step n={4}>Aperte em <strong>"Conectar com número de telefone"</strong></Step>
                      <Step n={5}>Digite o código de 8 letras acima</Step>
                    </ol>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPhone("");
                        requestPair.reset();
                      }}
                    >
                      Pedir outro código
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    connected: { label: "Conectado", className: "bg-success-soft text-success", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    pairing: { label: "Aguardando você escanear/digitar", className: "bg-warning-soft text-warning", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    disconnected: { label: "Desconectado", className: "bg-muted text-muted-foreground", icon: <WifiOff className="h-3.5 w-3.5" /> },
  };
  const m = map[status] ?? map.disconnected;
  return (
    <div className="flex justify-center">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", m.className)}>
        {m.icon}
        {m.label}
      </span>
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</span>
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>}
      <span className="text-foreground">{children}</span>
    </li>
  );
}
