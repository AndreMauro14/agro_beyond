import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { WhatsappApiRepository } from "@/infrastructure/repositories/WhatsappApiRepository";
import { GetWhatsappStatus } from "@/application/use-cases/whatsapp/GetWhatsappStatus";
import type { WhatsappStatus } from "@/domain/entities/WhatsappStatus";

export function useWhatsappStatus(pollMs = 2000) {
  const useCase = useMemo(() => new GetWhatsappStatus(new WhatsappApiRepository()), []);
  return useQuery<WhatsappStatus>({
    queryKey: ["whatsapp-status"],
    queryFn: () => useCase.execute(),
    refetchInterval: pollMs,
    refetchIntervalInBackground: true,
  });
}
