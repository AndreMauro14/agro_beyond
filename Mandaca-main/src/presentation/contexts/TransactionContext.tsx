import { createContext, useContext, useState, ReactNode } from "react";

export type TxType = "entrada" | "saida";

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TransactionContext = createContext<Ctx | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TransactionContext.Provider value={{ open, setOpen }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}
