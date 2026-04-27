import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WhatsappApiRepository } from "@/infrastructure/repositories/WhatsappApiRepository";
import { GetWhatsappStatus } from "@/application/use-cases/whatsapp/GetWhatsappStatus";
import { RequestPairCode } from "@/application/use-cases/whatsapp/RequestPairCode";
import type { WhatsappStatus } from "@/domain/entities/WhatsappStatus";

const useWhatsappUseCases = () => {
  return useMemo(() => {
    const repo = new WhatsappApiRepository();
    return {
      getStatus: new GetWhatsappStatus(repo),
      requestPairCode: new RequestPairCode(repo),
    };
  }, []);
};

export function useWhatsappStatus(pollMs = 2000) {
  const { getStatus } = useWhatsappUseCases();
  return useQuery<WhatsappStatus>({
    queryKey: ["whatsapp-status"],
    queryFn: () => getStatus.execute(),
    refetchInterval: pollMs,
    refetchIntervalInBackground: true,
  });
}

export function useRequestPairCode() {
  const { requestPairCode } = useWhatsappUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phone: string) => requestPairCode.execute(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });
}
