import type { IGanhoRepository } from "@/domain/repositories/IGanhoRepository";
import type { NovoGanho } from "@/domain/entities/Ganho";

export class CreateGanho {
  constructor(private readonly repo: IGanhoRepository) {}

  execute(data: NovoGanho): Promise<number | null> {
    return this.repo.create(data);
  }
}
