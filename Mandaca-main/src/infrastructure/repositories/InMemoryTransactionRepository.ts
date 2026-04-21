import type { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import type { Transaction } from "@/domain/entities/Transaction";

export class InMemoryTransactionRepository implements ITransactionRepository {
  constructor(
    private state: Transaction[],
    private readonly setState: (updater: (prev: Transaction[]) => Transaction[]) => void,
  ) {}

  list(): Transaction[] {
    return this.state;
  }

  add(tx: Omit<Transaction, "id">): Transaction {
    const created: Transaction = { ...tx, id: crypto.randomUUID() };
    this.setState((prev) => [created, ...prev]);
    return created;
  }

  remove(id: string): void {
    this.setState((prev) => prev.filter((t) => t.id !== id));
  }
}
