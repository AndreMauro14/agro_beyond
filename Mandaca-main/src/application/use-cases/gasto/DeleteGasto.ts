import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";

export class DeleteGasto {
  constructor(private readonly repo: IGastoRepository) {}

  execute(id: number): Promise<boolean> {
    return this.repo.remove(id);
  }
}
