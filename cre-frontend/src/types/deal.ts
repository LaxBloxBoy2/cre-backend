export interface Deal {
  id: string;
  project_name: string;
  location: string;
  property_type: string;
  acquisition_price: number;
  construction_cost: number;
  square_footage: number;
  projected_rent_per_sf: number;
  vacancy_rate: number;
  operating_expenses_per_sf: number;
  exit_cap_rate: number;
  user_id: string;
  org_id: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';
  created_at: string;
  updated_at: string;
  irr?: number;
  dscr?: number;
  tags?: string[];
}

export interface DealCreate {
  project_name: string;
  location: string;
  property_type: string;
  acquisition_price: number;
  construction_cost: number;
  square_footage: number;
  projected_rent_per_sf: number;
  vacancy_rate: number;
  operating_expenses_per_sf: number;
  exit_cap_rate: number;
}

export interface DealUpdate {
  project_name?: string;
  location?: string;
  property_type?: string;
  acquisition_price?: number;
  construction_cost?: number;
  square_footage?: number;
  projected_rent_per_sf?: number;
  vacancy_rate?: number;
  operating_expenses_per_sf?: number;
  exit_cap_rate?: number;
  status?: 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';
  tags?: string[];
}

export interface DealSummary {
  total_deals: number;
  total_acquisition_price: number;
  total_construction_cost: number;
  total_square_footage: number;
  average_irr: number;
  average_dscr: number;
  status_counts: Record<string, number>;
  property_type_counts: Record<string, number>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context: {
    deal?: Deal;
    [key: string]: any;
  };
}

export interface ChatResponse {
  reply: string;
  debug?: {
    intent: string;
    system_message: string;
    tokens_estimated: number;
    fallback_mode: boolean;
  };
}
