'use client';

// Types
export interface WaterfallTier {
  tier_order: number;
  hurdle: number;
  gp_split: number;
  lp_split: number;
}

export interface PromoteStructure {
  id: string;
  name: string;
  deal_id: string;
  created_at: string;
  tiers: WaterfallTier[];
}

export interface YearlyDistribution {
  year: number;
  total_cash_flow: number;
  gp_distribution: number;
  lp_distribution: number;
  cumulative_gp: number;
  cumulative_lp: number;
  cumulative_total: number;
  gp_percentage: number;
  lp_percentage: number;
}

export interface WaterfallCalculationResult {
  structure_id: string;
  structure_name: string;
  yearly_distributions: YearlyDistribution[];
  total_gp_distribution: number;
  total_lp_distribution: number;
  gp_irr: number;
  lp_irr: number;
  gp_multiple: number;
  lp_multiple: number;
}

// Demo data for waterfall structures
export const DEMO_WATERFALL_STRUCTURES: PromoteStructure[] = [
  {
    id: 'demo-structure-1',
    name: 'Standard Promote',
    deal_id: 'demo-deal',
    created_at: new Date().toISOString(),
    tiers: [
      { tier_order: 1, hurdle: 8, gp_split: 0, lp_split: 100 },
      { tier_order: 2, hurdle: 12, gp_split: 20, lp_split: 80 },
      { tier_order: 3, hurdle: 15, gp_split: 30, lp_split: 70 }
    ]
  },
  {
    id: 'demo-structure-2',
    name: 'Aggressive Promote',
    deal_id: 'demo-deal',
    created_at: new Date().toISOString(),
    tiers: [
      { tier_order: 1, hurdle: 7, gp_split: 0, lp_split: 100 },
      { tier_order: 2, hurdle: 10, gp_split: 25, lp_split: 75 },
      { tier_order: 3, hurdle: 14, gp_split: 35, lp_split: 65 }
    ]
  }
];

// Demo data for waterfall calculation result
export const DEMO_WATERFALL_CALCULATION: WaterfallCalculationResult = {
  structure_id: 'demo-structure-1',
  structure_name: 'Standard Promote',
  yearly_distributions: [
    {
      year: 1,
      total_cash_flow: 100000,
      gp_distribution: 0,
      lp_distribution: 100000,
      cumulative_gp: 0,
      cumulative_lp: 100000,
      cumulative_total: 100000,
      gp_percentage: 0,
      lp_percentage: 100
    },
    {
      year: 2,
      total_cash_flow: 120000,
      gp_distribution: 0,
      lp_distribution: 120000,
      cumulative_gp: 0,
      cumulative_lp: 220000,
      cumulative_total: 220000,
      gp_percentage: 0,
      lp_percentage: 100
    },
    {
      year: 3,
      total_cash_flow: 130000,
      gp_distribution: 0,
      lp_distribution: 130000,
      cumulative_gp: 0,
      cumulative_lp: 350000,
      cumulative_total: 350000,
      gp_percentage: 0,
      lp_percentage: 100
    },
    {
      year: 4,
      total_cash_flow: 140000,
      gp_distribution: 0,
      lp_distribution: 140000,
      cumulative_gp: 0,
      cumulative_lp: 490000,
      cumulative_total: 490000,
      gp_percentage: 0,
      lp_percentage: 100
    },
    {
      year: 5,
      total_cash_flow: 1500000,
      gp_distribution: 300000,
      lp_distribution: 1200000,
      cumulative_gp: 300000,
      cumulative_lp: 1690000,
      cumulative_total: 1990000,
      gp_percentage: 15.08,
      lp_percentage: 84.92
    }
  ],
  total_gp_distribution: 300000,
  total_lp_distribution: 1690000,
  gp_irr: 25.89,
  lp_irr: 14.11,
  gp_multiple: 3.0,
  lp_multiple: 1.69
};

// Export hooks from the app/hooks/waterfall.ts file
// These are just stubs to prevent import errors
// The actual implementation will be in app/hooks/waterfall.ts
export const useWaterfallStructures = (dealId: string) => {
  console.warn('Using stub implementation of useWaterfallStructures from src/hooks/waterfall.ts');
  return {
    data: DEMO_WATERFALL_STRUCTURES,
    isLoading: false,
    error: null
  };
};

export const useCreateWaterfallStructure = (dealId: string) => {
  console.warn('Using stub implementation of useCreateWaterfallStructure from src/hooks/waterfall.ts');
  return {
    mutate: async () => {},
    isPending: false
  };
};

export const useCalculateWaterfall = (dealId: string) => {
  console.warn('Using stub implementation of useCalculateWaterfall from src/hooks/waterfall.ts');
  return {
    mutate: async () => DEMO_WATERFALL_CALCULATION,
    isPending: false
  };
};
