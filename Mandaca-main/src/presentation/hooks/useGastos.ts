import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GastoApiRepository } from "@/infrastructure/repositories/GastoApiRepository";
import { ListGastos } from "@/application/use-cases/gasto/ListGastos";
import { AprovarGasto } from "@/application/use-cases/gasto/AprovarGasto";
import { ReprovarGasto } from "@/application/use-cases/gasto/ReprovarGasto";
import { GetRelatorioGastos } from "@/application/use-cases/gasto/GetRelatorioGastos";

const useGastoUseCases = () => {
  return useMemo(() => {
    const repo = new GastoApiRepository();
    return {
      list: new ListGastos(repo),
      aprovar: new AprovarGasto(repo),
      reprovar: new ReprovarGasto(repo),
      relatorio: new GetRelatorioGastos(repo),
    };
  }, []);
};

export function useGastos() {
  const { list } = useGastoUseCases();
  return useQuery({
    queryKey: ["gastos"],
    queryFn: () => list.execute(),
  });
}

export function useAprovarGasto() {
  const { aprovar } = useGastoUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => aprovar.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-total"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-por-setor"] });
    },
  });
}

export function useReprovarGasto() {
  const { reprovar } = useGastoUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reprovar.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      queryClient.invalidateQueries({ queryKey: ["ocorrencias"] });
    },
  });
}

export function useRelatorioTotal() {
  const { relatorio } = useGastoUseCases();
  return useQuery({
    queryKey: ["relatorio-total"],
    queryFn: () => relatorio.total(),
  });
}

export function useRelatorioPorSetor() {
  const { relatorio } = useGastoUseCases();
  return useQuery({
    queryKey: ["relatorio-por-setor"],
    queryFn: () => relatorio.porSetor(),
  });
}
