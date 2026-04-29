import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";

export class ReprovarGasto {
  constructor(private readonly repo: IGastoRepository) {}

  execute(id: number): Promise<boolean> {
    return this.repo.reprovar(id);
  }
}
