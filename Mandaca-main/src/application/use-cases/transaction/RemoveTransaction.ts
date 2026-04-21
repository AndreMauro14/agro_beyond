import type { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";

export class RemoveTransaction {
  constructor(private readonly repo: ITransactionRepository) {}

  execute(id: string): void {
    this.repo.remove(id);
  }
}
