import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";

export class AprovarGasto {
  constructor(private readonly repo: IGastoRepository) {}

  execute(id: number): Promise<boolean> {
    return this.repo.aprovar(id);
  }
}
