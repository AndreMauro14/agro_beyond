import type { IGanhoRepository } from "@/domain/repositories/IGanhoRepository";
import type { Ganho } from "@/domain/entities/Ganho";

export class ListGanhos {
  constructor(private readonly repo: IGanhoRepository) {}

  execute(): Promise<Ganho[]> {
    return this.repo.list();
  }
}
