import type { Transaction } from "../entities/Transaction";

export interface ITransactionRepository {
  list(): Transaction[];
  add(tx: Omit<Transaction, "id">): Transaction;
  remove(id: string): void;
}
