import { useState } from "react";
import { Calculator, PieChart, Sprout, Wrench, Mountain, TrendingUp } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { formatBRL } from "@/application/services/format.service";
import { toast } from "sonner";

interface Result {
  custoFixo: number;
  custoHectare: number;
  precoSaca: number;
}

export default function Calculadora() {
  const [hectares, setHectares] = useState("");
  const [margem, setMargem] = useState("");
  const [sementes, setSementes] = useState("");
  const [adubos, setAdubos] = useState("");
  const [operacionais, setOperacionais] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const parse = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault();
    const ha = parse(hectares);
    const m = parse(margem);
    const s = parse(sementes);
    const a = parse(adubos);
    const o = parse(operacionais);

    if (!ha || ha <= 0) {
      toast.error("Informe a área plantada em hectares");
      return;
    }

    const custoFixo = s + a + o;
    const custoHectare = custoFixo / ha;
    // Assumindo produtividade média de 60 sacas/ha (soja)
    const sacasPorHa = 60;
    const custoPorSaca = custoHectare / sacasPorHa;
    const precoSaca = custoPorSaca * (1 + m / 100);

    setResult({ custoFixo, custoHectare, precoSaca });
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">Simule sua Rentabilidade</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Insira os custos estimados da sua próxima safra. Nossa calculadora projeta o custo por hectare e define o{" "}
        <strong className="text-foreground">preço mínimo de venda</strong> necessário para atingir sua meta de lucro,
        garantindo a saúde financeira do seu campo.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Form */}
        <form onSubmit={handleCalcular} className="rounded-lg bg-card-elevated p-6 shadow-card ring-1 ring-border/40">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-primary">Custos de Produção</h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field label="Área Total Plantada (ha)" icon={<Mountain className="h-3.5 w-3.5" />}>
              <Input placeholder="Ex: 500" value={hectares} onChange={(e) => setHectares(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Margem de Lucro Desejada (%)" icon={<TrendingUp className="h-3.5 w-3.5" />}>
              <Input placeholder="Ex: 25" value={margem} onChange={(e) => setMargem(e.target.value)} inputMode="decimal" />
            </Field>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-warning">Detalhamento de Custos (R$)</p>

          <div className="mt-3 space-y-4">
            <Field label="Sementes" icon={<Sprout className="h-3.5 w-3.5" />}>
              <Input placeholder="R$ 0,00" value={sementes} onChange={(e) => setSementes(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Adubos e Fertilizantes" icon={<Sprout className="h-3.5 w-3.5" />}>
              <Input placeholder="R$ 0,00" value={adubos} onChange={(e) => setAdubos(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Custos Operacionais (Trator, Mão de obra)" icon={<Wrench className="h-3.5 w-3.5" />}>
              <Input placeholder="R$ 0,00" value={operacionais} onChange={(e) => setOperacionais(e.target.value)} inputMode="decimal" />
            </Field>
          </div>

          <Button type="submit" className="mt-6 h-12 w-full bg-primary text-base text-primary-foreground hover:bg-primary-glow">
            Calcular Projeção
          </Button>
        </form>

        {/* Resultados */}
        <div className="space-y-4">
          <div className="rounded-lg bg-card p-6 shadow-card ring-1 ring-border/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custo Fixo Projetado</p>
            <p className="mt-3 font-display text-3xl font-extrabold text-primary">
              {result ? formatBRL(result.custoFixo) : "R$ ——"}
            </p>
          </div>

          <div className="rounded-lg bg-card-elevated p-6 shadow-card ring-1 ring-border/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custo por Hectare</p>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-primary">
              {result ? formatBRL(result.custoHectare) : "R$ ——"}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Este é o valor mínimo que cada hectare precisa gerar apenas para cobrir seus custos diretos.
            </p>
          </div>

          <div className="rounded-lg bg-warning p-6 text-warning-foreground shadow-elevated">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Preço Mínimo p/ Venda (Saca)</p>
            <p className="mt-3 font-display text-3xl font-extrabold">
              {result ? formatBRL(result.precoSaca) : "R$ ——"}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-md bg-warning-foreground/15 px-3 py-1 text-xs font-medium">
              <TrendingUp className="h-3 w-3" />
              Meta de lucro: {margem ? `${margem}%` : "25%"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        {label}
      </Label>
      {children}
    </div>
  );
}
