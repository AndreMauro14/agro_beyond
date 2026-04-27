import type { IGastoRepository, CreateGastoInput } from "@/domain/repositories/IGastoRepository";

export class CreateGasto {
  constructor(private readonly repo: IGastoRepository) {}

  execute(data: CreateGastoInput): Promise<number | null> {
    return this.repo.create(data);
  }
}
