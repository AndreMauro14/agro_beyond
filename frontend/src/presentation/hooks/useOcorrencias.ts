import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OcorrenciaApiRepository } from "@/infrastructure/repositories/OcorrenciaApiRepository";
import { ListOcorrencias } from "@/application/use-cases/ocorrencia/ListOcorrencias";
import { GetOcorrencia } from "@/application/use-cases/ocorrencia/GetOcorrencia";
import { UpdateOcorrenciaStatus } from "@/application/use-cases/ocorrencia/UpdateOcorrenciaStatus";
import { DeleteOcorrencia } from "@/application/use-cases/ocorrencia/DeleteOcorrencia";

const useOcorrenciaUseCases = () => {
  return useMemo(() => {
    const repo = new OcorrenciaApiRepository();
    return {
      list: new ListOcorrencias(repo),
      get: new GetOcorrencia(repo),
      updateStatus: new UpdateOcorrenciaStatus(repo),
      delete: new DeleteOcorrencia(repo),
    };
  }, []);
};

export function useOcorrencias() {
  const { list } = useOcorrenciaUseCases();
  return useQuery({
    queryKey: ["ocorrencias"],
    queryFn: () => list.execute(),
  });
}

export function useOcorrencia(id: number | undefined) {
  const { get } = useOcorrenciaUseCases();
  return useQuery({
    queryKey: ["ocorrencia", id],
    queryFn: () => get.execute(id as number),
    enabled: typeof id === "number",
  });
}

export function useUpdateOcorrenciaStatus() {
  const { updateStatus } = useOcorrenciaUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateStatus.execute(id, status),
    onSuccess: (_ok, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      queryClient.invalidateQueries({ queryKey: ["ocorrencia", vars.id] });
    },
  });
}

export function useDeleteOcorrencia() {
  const { delete: deleteUC } = useOcorrenciaUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUC.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-total"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-por-setor"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-por-produto"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-por-mes"] });
    },
  });
}
