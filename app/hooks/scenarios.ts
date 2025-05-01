'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScenarios, createScenario, deleteScenario } from '../lib/api';

// Types
export interface Scenario {
  id: string;
  deal_id: string;
  name: string;
  var_changed: string;
  delta: number;
  irr?: number;
  cashflow_data?: any;
  created_at: string;
}

export interface ScenarioCreate {
  name: string;
  var_changed: string;
  delta: number;
}

// Demo data for scenarios
const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'demo-scenario-1',
    deal_id: 'demo-deal',
    name: 'Base Case',
    var_changed: 'interest',
    delta: 0,
    irr: 15.2,
    cashflow_data: {
      years: [1, 2, 3, 4, 5],
      noi: [100000, 103000, 106090, 109273, 112551],
      debt_service: [60000, 60000, 60000, 60000, 60000],
      cash_flow: [40000, 43000, 46090, 49273, 52551],
      exit_value: 2000000,
      net_proceeds: 1500000
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-scenario-2',
    deal_id: 'demo-deal',
    name: 'Interest Rate +50bps',
    var_changed: 'interest',
    delta: 0.5,
    irr: 14.3,
    cashflow_data: {
      years: [1, 2, 3, 4, 5],
      noi: [100000, 103000, 106090, 109273, 112551],
      debt_service: [65000, 65000, 65000, 65000, 65000],
      cash_flow: [35000, 38000, 41090, 44273, 47551],
      exit_value: 2000000,
      net_proceeds: 1500000
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-scenario-3',
    deal_id: 'demo-deal',
    name: 'Exit Cap +50bps',
    var_changed: 'exit_cap',
    delta: 0.5,
    irr: 13.1,
    cashflow_data: {
      years: [1, 2, 3, 4, 5],
      noi: [100000, 103000, 106090, 109273, 112551],
      debt_service: [60000, 60000, 60000, 60000, 60000],
      cash_flow: [40000, 43000, 46090, 49273, 52551],
      exit_value: 1800000,
      net_proceeds: 1300000
    },
    created_at: new Date().toISOString()
  }
];

// Hooks
export const useScenarios = (dealId: string) => {
  return useQuery({
    queryKey: ['scenarios', dealId],
    queryFn: async () => {
      try {
        // Check if we're using demo token - if so, return demo data immediately
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token === 'demo_access_token') {
            console.log('Using demo token - returning demo scenarios');
            return DEMO_SCENARIOS;
          }
        }
        
        return await getScenarios(dealId);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
        return DEMO_SCENARIOS;
      }
    },
    enabled: !!dealId,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useCreateScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ScenarioCreate) => {
      try {
        // Check if we're using demo token - if so, simulate success
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token === 'demo_access_token') {
            console.log('Using demo token - simulating scenario creation');
            
            // Create a new demo scenario
            const newScenario: Scenario = {
              id: `demo-scenario-${Date.now()}`,
              deal_id: dealId,
              name: data.name,
              var_changed: data.var_changed,
              delta: data.delta,
              irr: 15.2 - (data.delta * 1.8), // Simple calculation for demo
              cashflow_data: {
                years: [1, 2, 3, 4, 5],
                noi: [100000, 103000, 106090, 109273, 112551],
                debt_service: [60000, 60000, 60000, 60000, 60000],
                cash_flow: [40000, 43000, 46090, 49273, 52551],
                exit_value: 2000000 - (data.var_changed === 'exit_cap' ? data.delta * 200000 : 0),
                net_proceeds: 1500000 - (data.var_changed === 'exit_cap' ? data.delta * 200000 : 0)
              },
              created_at: new Date().toISOString()
            };
            
            // Add to demo data
            DEMO_SCENARIOS.push(newScenario);
            
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return newScenario;
          }
        }
        
        return await createScenario(dealId, data);
      } catch (error) {
        console.error('Error creating scenario:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
    },
  });
};

export const useDeleteScenario = (dealId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scenarioId: string) => {
      try {
        // Check if we're using demo token - if so, simulate success
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token === 'demo_access_token') {
            console.log('Using demo token - simulating scenario deletion');
            
            // Remove from demo data
            const index = DEMO_SCENARIOS.findIndex(s => s.id === scenarioId);
            if (index !== -1) {
              DEMO_SCENARIOS.splice(index, 1);
            }
            
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true };
          }
        }
        
        return await deleteScenario(dealId, scenarioId);
      } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', dealId] });
    },
  });
};
