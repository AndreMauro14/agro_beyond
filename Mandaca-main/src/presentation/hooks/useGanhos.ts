import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GanhoApiRepository } from "@/infrastructure/repositories/GanhoApiRepository";
import { ListGanhos } from "@/application/use-cases/ganho/ListGanhos";
import { CreateGanho } from "@/application/use-cases/ganho/CreateGanho";
import { DeleteGanho } from "@/application/use-cases/ganho/DeleteGanho";
import type { NovoGanho } from "@/domain/entities/Ganho";

const useGanhoUseCases = () => {
  return useMemo(() => {
    const repo = new GanhoApiRepository();
    return {
      list: new ListGanhos(repo),
      create: new CreateGanho(repo),
      delete: new DeleteGanho(repo),
      repo,
    };
  }, []);
};

export function useGanhos() {
  const { list } = useGanhoUseCases();
  return useQuery({
    queryKey: ["ganhos"],
    queryFn: () => list.execute(),
  });
}

export function useCreateGanho() {
  const { create } = useGanhoUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NovoGanho) => create.execute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ganhos"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-ganhos-por-mes"] });
    },
  });
}

export function useDeleteGanho() {
  const { delete: deleteUC } = useGanhoUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUC.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ganhos"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-ganhos-por-mes"] });
    },
  });
}

export function useRelatorioGanhosPorMes(meses = 6) {
  const { repo } = useGanhoUseCases();
  return useQuery({
    queryKey: ["relatorio-ganhos-por-mes", meses],
    queryFn: () => repo.getPorMes(meses),
  });
}
