import type { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import type { Transaction } from "@/domain/entities/Transaction";

export class AddTransaction {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(input: Omit<Transaction, "id">): Transaction {
    return this.repo.add(input);
  }
}
