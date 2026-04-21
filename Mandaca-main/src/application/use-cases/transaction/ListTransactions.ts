import type { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import type { Transaction } from "@/domain/entities/Transaction";

export class ListTransactions {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(): Transaction[] {
    return this.repo.list();
  }
}
