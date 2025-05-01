export interface UnderwritingInput {
  // Acquisition & Exit
  purchase_price: number;
  exit_cap_rate: number;
  noi_growth_rate: number;
  holding_period_years: number;

  // Income Assumptions
  rent_per_sf: number;
  vacancy_rate: number;
  square_footage: number;
  other_income?: number;
  rent_growth_rate?: number;

  // Operating Expenses
  operating_expenses_per_sf: number;
  property_tax_rate?: number;
  insurance_cost?: number;
  management_fee_percent?: number;
  maintenance_reserve_per_sf?: number;
  expense_growth_rate?: number;

  // Financing Structure
  loan_amount: number;
  interest_rate: number;
  amortization_years: number;
  loan_term_years: number;
  loan_fees_percent?: number;

  // Market Metrics
  market_vacancy_rate?: number;
  market_cap_rate?: number;
  market_rent_growth?: number;
  market_expense_growth?: number;
}

export interface UnderwritingResult {
  // Income Metrics
  projected_noi: number;
  effective_gross_income: number;
  operating_expenses: number;

  // Return Metrics
  cap_rate: number;
  dscr: number;
  irr: number;
  cash_on_cash_return: number;
  equity_multiple: number;

  // Valuation Metrics
  exit_value: number;
  loan_to_value: number;

  // Cash Flow Metrics
  annual_cash_flows: AnnualCashFlow[];

  // Sensitivity Analysis
  sensitivity?: SensitivityAnalysis;
}

export interface AnnualCashFlow {
  year: number;
  gross_potential_income: number;
  vacancy_loss: number;
  effective_gross_income: number;
  operating_expenses: number;
  net_operating_income: number;
  debt_service: number;
  cash_flow: number;
  cumulative_cash_flow: number;
}

export interface SensitivityAnalysis {
  exit_cap_rate: Record<string, number>; // e.g., {"5.5%": 18.2, "6.0%": 16.5, "6.5%": 14.8}
  rent_growth: Record<string, number>;
  vacancy_rate: Record<string, number>;
  interest_rate: Record<string, number>;
}

export interface UnderwritingScenario {
  id: string;
  deal_id: string;
  label: string;
  description?: string;
  assumptions: UnderwritingInput;
  results: UnderwritingResult;
  created_by: string;
  created_at: string;
  modified_by?: string;
  modified_at?: string;
}

export interface ScenarioComparison {
  base_scenario_id: string;
  compare_scenario_id: string;
  differences: {
    assumptions: Record<string, { base: any; compare: any }>;
    results: Record<string, { base: any; compare: any }>;
  };
}

export interface AuditTrailEntry {
  timestamp: string;
  user_id: string;
  user_name: string;
  field_changed: string;
  old_value: any;
  new_value: any;
}

// Demo data for testing
export const DEMO_UNDERWRITING_RESULT: UnderwritingResult = {
  projected_noi: 285000,
  effective_gross_income: 330000,
  operating_expenses: 45000,
  cap_rate: 0.067,
  dscr: 1.29,
  irr: 14.8,
  cash_on_cash_return: 9.2,
  equity_multiple: 1.76,
  exit_value: 2380000,
  loan_to_value: 0.65,
  annual_cash_flows: [
    {
      year: 1,
      gross_potential_income: 350000,
      vacancy_loss: 20000,
      effective_gross_income: 330000,
      operating_expenses: 45000,
      net_operating_income: 285000,
      debt_service: 220000,
      cash_flow: 65000,
      cumulative_cash_flow: 65000
    },
    {
      year: 2,
      gross_potential_income: 360500,
      vacancy_loss: 18025,
      effective_gross_income: 342475,
      operating_expenses: 46350,
      net_operating_income: 296125,
      debt_service: 220000,
      cash_flow: 76125,
      cumulative_cash_flow: 141125
    },
    {
      year: 3,
      gross_potential_income: 371315,
      vacancy_loss: 18566,
      effective_gross_income: 352749,
      operating_expenses: 47741,
      net_operating_income: 305008,
      debt_service: 220000,
      cash_flow: 85008,
      cumulative_cash_flow: 226133
    },
    {
      year: 4,
      gross_potential_income: 382454,
      vacancy_loss: 19123,
      effective_gross_income: 363331,
      operating_expenses: 49173,
      net_operating_income: 314158,
      debt_service: 220000,
      cash_flow: 94158,
      cumulative_cash_flow: 320291
    },
    {
      year: 5,
      gross_potential_income: 393928,
      vacancy_loss: 19696,
      effective_gross_income: 374232,
      operating_expenses: 50648,
      net_operating_income: 323584,
      debt_service: 220000,
      cash_flow: 103584,
      cumulative_cash_flow: 423875
    }
  ]
};

// Demo scenarios for testing
export const DEMO_SCENARIOS: UnderwritingScenario[] = [
  {
    id: "base-case",
    deal_id: "1",
    label: "Base Case",
    description: "Standard market assumptions",
    assumptions: {
      purchase_price: 1200000,
      exit_cap_rate: 0.065,
      noi_growth_rate: 0.03,
      holding_period_years: 5,
      rent_per_sf: 27.5,
      vacancy_rate: 0.08,
      square_footage: 12000,
      operating_expenses_per_sf: 8.5,
      loan_amount: 800000,
      interest_rate: 0.065,
      amortization_years: 30,
      loan_term_years: 5
    },
    results: DEMO_UNDERWRITING_RESULT,
    created_by: "user-1",
    created_at: "2023-06-15T12:00:00Z"
  },
  {
    id: "optimistic-case",
    deal_id: "1",
    label: "Optimistic Case",
    description: "Lower vacancy, higher rent growth",
    assumptions: {
      purchase_price: 1200000,
      exit_cap_rate: 0.06,
      noi_growth_rate: 0.04,
      holding_period_years: 5,
      rent_per_sf: 28.5,
      vacancy_rate: 0.05,
      square_footage: 12000,
      operating_expenses_per_sf: 8.5,
      loan_amount: 800000,
      interest_rate: 0.065,
      amortization_years: 30,
      loan_term_years: 5
    },
    results: {
      ...DEMO_UNDERWRITING_RESULT,
      irr: 17.2,
      cash_on_cash_return: 10.5,
      equity_multiple: 1.92,
      exit_value: 2650000
    },
    created_by: "user-1",
    created_at: "2023-06-15T14:30:00Z"
  },
  {
    id: "downside-case",
    deal_id: "1",
    label: "Downside Case",
    description: "Higher vacancy, lower rent growth, higher cap rate",
    assumptions: {
      purchase_price: 1200000,
      exit_cap_rate: 0.07,
      noi_growth_rate: 0.02,
      holding_period_years: 5,
      rent_per_sf: 26.5,
      vacancy_rate: 0.12,
      square_footage: 12000,
      operating_expenses_per_sf: 9.0,
      loan_amount: 800000,
      interest_rate: 0.065,
      amortization_years: 30,
      loan_term_years: 5
    },
    results: {
      ...DEMO_UNDERWRITING_RESULT,
      irr: 11.5,
      cash_on_cash_return: 7.8,
      equity_multiple: 1.58,
      exit_value: 2100000
    },
    created_by: "user-1",
    created_at: "2023-06-15T15:45:00Z"
  }
];
