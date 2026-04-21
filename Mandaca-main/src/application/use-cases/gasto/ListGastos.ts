import type { IGastoRepository } from "@/domain/repositories/IGastoRepository";
import type { Gasto } from "@/domain/entities/Gasto";

export class ListGastos {
  constructor(private readonly repo: IGastoRepository) {}

  execute(): Promise<Gasto[]> {
    return this.repo.list();
  }
}
