export const formatBRL = (value: number, opts: { withSign?: boolean } = {}) => {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));
  if (opts.withSign) {
    return `${value >= 0 ? "+ " : "- "}${formatted}`;
  }
  return formatted;
};

export const formatBRLCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateShort = (iso: string) => {
  const d = new Date(iso);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
