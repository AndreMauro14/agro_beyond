import type { IGastoRepository, UpdateGastoInput } from "@/domain/repositories/IGastoRepository";

export class UpdateGasto {
  constructor(private readonly repo: IGastoRepository) {}

  execute(id: number, data: UpdateGastoInput): Promise<boolean> {
    return this.repo.update(id, data);
  }
}
