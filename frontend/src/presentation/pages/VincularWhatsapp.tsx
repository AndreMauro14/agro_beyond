import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { authRepository } from "@/infrastructure/repositories/AuthApiRepository";

export default function VincularWhatsapp() {
  const navigate = useNavigate();
  const { usuario, refreshUsuario } = useAuth();
  const [etapa, setEtapa] = useState<"telefone" | "codigo">("telefone");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const jaVinculado = !!usuario?.telefone_whatsapp;

  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = telefone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Digite o número completo com DDD");
      return;
    }
    setLoading(true);
    try {
      await authRepository.requestVincularWhatsapp(digits);
      setTelefone(digits);
      setEtapa("codigo");
      toast.success("Código enviado pelo WhatsApp. Verifique suas mensagens.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authRepository.verifyVincularWhatsapp(telefone, codigo.trim());
      await refreshUsuario();
      toast.success("WhatsApp vinculado com sucesso!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  if (jaVinculado) {
    return (
      <div className="container flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl bg-card-elevated p-6 shadow-elevated ring-1 ring-border/40 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h1 className="font-display text-2xl font-extrabold text-success">WhatsApp já vinculado</h1>
            <p className="text-sm text-muted-foreground">
              Seu número <strong>{usuario?.telefone_whatsapp}</strong> está conectado à sua conta.
              Mensagens enviadas dele para o bot vão virar ocorrências na sua conta automaticamente.
            </p>
            <Button onClick={() => navigate("/")} className="mt-2">Ir para o painel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl bg-card-elevated p-6 shadow-elevated ring-1 ring-border/40 sm:p-8">
        <div className="mb-6 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-extrabold text-primary sm:text-3xl">Vincular WhatsApp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conecte seu número pra registrar gastos e ocorrências direto pelo zap.
          </p>
        </div>

        {etapa === "telefone" && (
          <form onSubmit={enviarCodigo} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Número do WhatsApp (com DDD)</Label>
              <Input
                id="telefone"
                inputMode="tel"
                autoComplete="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="81 99999-8888"
              />
              <p className="text-xs text-muted-foreground">Sem o "+55", só DDD + número</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar código pelo WhatsApp
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Pular por enquanto
            </Button>
          </form>
        )}

        {etapa === "codigo" && (
          <form onSubmit={verificarCodigo} className="space-y-4">
            <div className="rounded-lg bg-card p-4 text-sm ring-1 ring-border/40">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                Enviamos um código de 6 dígitos para <strong className="text-foreground">{telefone}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código recebido</Label>
              <Input
                id="codigo"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar código
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setEtapa("telefone");
                setCodigo("");
              }}
            >
              Trocar de número
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
