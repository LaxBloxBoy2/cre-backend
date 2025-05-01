export interface Scenario {
  id: string;
  deal_id: string;
  name: string;
  var_changed: string;
  delta: number;
  irr: number | null;
  cashflow_json: any;
  created_at: string;
}

export interface ScenarioCreate {
  name: string;
  var_changed: string;
  delta: number;
}

export interface ScenarioList {
  scenarios: Scenario[];
  total: number;
}

export interface CashflowYear {
  year: number;
  noi: number;
  debt_service: number;
  free_cash: number;
  cumulative: number;
}

export interface CashflowData {
  yearly: CashflowYear[];
  exit_value: number;
  exit_proceeds: number;
  final_cash: number;
}
