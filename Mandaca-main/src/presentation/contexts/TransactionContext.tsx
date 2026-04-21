import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Transaction, TxType } from "@/domain/entities/Transaction";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";
import { AddTransaction } from "@/application/use-cases/transaction/AddTransaction";
import { RemoveTransaction } from "@/application/use-cases/transaction/RemoveTransaction";
import { ListTransactions } from "@/application/use-cases/transaction/ListTransactions";

export type { Transaction, TxType };

interface Ctx {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TransactionContext = createContext<Ctx | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);

  const useCases = useMemo(() => {
    const repo = new InMemoryTransactionRepository(transactions, setTransactions);
    return {
      add: new AddTransaction(repo),
      remove: new RemoveTransaction(repo),
      list: new ListTransactions(repo),
    };
  }, [transactions]);

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    useCases.add.execute(tx);
  };

  const removeTransaction = (id: string) => {
    useCases.remove.execute(id);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, removeTransaction, open, setOpen }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}
