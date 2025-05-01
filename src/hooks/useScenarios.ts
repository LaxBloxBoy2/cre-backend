import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScenarios, createScenario, deleteScenario } from '@/lib/api';
import { ScenarioCreate } from '@/types/scenario';

export const useScenarios = (dealId: string) => {
  return useQuery({
    queryKey: ['scenarios', dealId],
    queryFn: () => getScenarios(dealId),
    enabled: !!dealId,
  });
};

export const useCreateScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scenario: ScenarioCreate) => createScenario(dealId, scenario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
    },
  });
};

export const useDeleteScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scenarioId: string) => deleteScenario(dealId, scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
    },
  });
};
