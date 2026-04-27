import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Loader2, Receipt } from "lucide-react";
import { useCreateGasto, useUpdateGasto } from "@/presentation/hooks/useGastos";
import { toast } from "sonner";

interface GastoValorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrenciaId: number;
  ocorrenciaDescricao: string;
  gastoExistente?: {
    id: number;
    nome_produto: string;
    valor_unitario: number;
    quantidade: number;
  } | null;
}

export default function GastoValorDialog({
  open, onOpenChange, ocorrenciaId, ocorrenciaDescricao, gastoExistente,
}: GastoValorDialogProps) {
  const [produto, setProduto] = useState("");
  const [valor, setValor] = useState("");
  const createGasto = useCreateGasto();
  const updateGasto = useUpdateGasto();

  const editando = !!gastoExistente;

  useEffect(() => {
    if (open) {
      setProduto(gastoExistente?.nome_produto ?? ocorrenciaDescricao.replace(/^\[Manual\]\s*/, ""));
      setValor(gastoExistente ? String(gastoExistente.valor_unitario).replace(".", ",") : "");
    }
  }, [open, gastoExistente, ocorrenciaDescricao]);

  const submitting = createGasto.isPending || updateGasto.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!produto.trim() || !valorNum || isNaN(valorNum) || valorNum <= 0) {
      toast.error("Preencha descrição e valor corretamente");
      return;
    }

    try {
      if (editando && gastoExistente) {
        await new Promise<void>((resolve, reject) => {
          updateGasto.mutate(
            { id: gastoExistente.id, data: { nome_produto: produto, valor_unitario: valorNum } },
            { onSuccess: () => resolve(), onError: (err) => reject(err) },
          );
        });
        toast.success("Valor atualizado");
      } else {
        await new Promise<void>((resolve, reject) => {
          createGasto.mutate(
            {
              id_ocorrencia: ocorrenciaId,
              nome_produto: produto,
              valor_unitario: valorNum,
              quantidade: 1,
            },
            { onSuccess: () => resolve(), onError: (err) => reject(err) },
          );
        });
        toast.success("Valor adicionado");
      }
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-primary">
            <Receipt className="h-6 w-6 text-warning" />
            {editando ? "Editar valor" : "Adicionar valor"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Altere o valor e a descrição do gasto vinculado a esta ocorrência."
              : "Registre quanto foi gasto nesta ocorrência."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gasto-produto">O que foi?</Label>
            <Input
              id="gasto-produto"
              placeholder="Ex.: Defensivo contra praga"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gasto-valor">Valor gasto (R$)</Label>
            <Input
              id="gasto-valor"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-glow" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editando ? "Salvar alteração" : "Adicionar valor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
