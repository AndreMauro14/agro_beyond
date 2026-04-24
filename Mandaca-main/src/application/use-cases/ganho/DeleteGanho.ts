import type { IGanhoRepository } from "@/domain/repositories/IGanhoRepository";

export class DeleteGanho {
  constructor(private readonly repo: IGanhoRepository) {}

  execute(id: number): Promise<boolean> {
    return this.repo.remove(id);
  }
}
