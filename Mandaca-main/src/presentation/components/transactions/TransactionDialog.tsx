import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { useTransactions, type TxType } from "@/presentation/contexts/TransactionContext";
import { useCreateGanho } from "@/presentation/hooks/useGanhos";
import { httpClient } from "@/infrastructure/http/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { cn } from "@/presentation/utils/cn";
import { toast } from "sonner";

const CATEGORIAS_ENTRADA = ["Receita Agrícola", "Receita Pecuária", "Subsídios", "Outros"];
const CATEGORIAS_SAIDA = ["Plantação", "Insumos", "Combustível", "Manutenção", "Equipamento", "Mão de obra", "Outros"];

export default function TransactionDialog() {
  const { open, setOpen } = useTransactions();
  const createGanho = useCreateGanho();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TxType>("entrada");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("entrada");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setCategory("");
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!description || !category || !valor || isNaN(valor) || valor <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    setSubmitting(true);
    try {
      if (type === "entrada") {
        await new Promise<void>((resolve, reject) => {
          createGanho.mutate(
            { descricao: description, categoria: category, valor, data: date },
            { onSuccess: () => resolve(), onError: (err) => reject(err) },
          );
        });
        toast.success("Entrada registrada");
      } else {
        await httpClient.post("/gastos/manual", {
          descricao: description,
          setor: category,
          valor,
        });
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
        queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
        queryClient.invalidateQueries({ queryKey: ["relatorio-total"] });
        queryClient.invalidateQueries({ queryKey: ["relatorio-por-setor"] });
        queryClient.invalidateQueries({ queryKey: ["relatorio-por-produto"] });
        queryClient.invalidateQueries({ queryKey: ["relatorio-por-mes"] });
        toast.success("Saída registrada");
      }
      reset();
      setOpen(false);
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const categorias = type === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Lançar Transação</DialogTitle>
          <DialogDescription>
            Registre uma nova entrada ou saída financeira da sua operação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType("entrada"); setCategory(""); }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border-2 p-3 text-sm font-semibold transition-all",
                type === "entrada"
                  ? "border-success bg-success-soft text-success"
                  : "border-border bg-card-soft text-muted-foreground hover:border-success/40",
              )}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => { setType("saida"); setCategory(""); }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border-2 p-3 text-sm font-semibold transition-all",
                type === "saida"
                  ? "border-warning bg-warning-soft text-warning"
                  : "border-border bg-card-soft text-muted-foreground hover:border-warning/40",
              )}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Saída
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder={type === "entrada" ? "Ex.: Venda de soja — Lote A2" : "Ex.: Adubo para o pomar"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-glow" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Lançamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
