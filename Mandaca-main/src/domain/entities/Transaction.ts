export type TxType = "entrada" | "saida";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TxType;
}
