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
  // New fields for pipeline
  deal_stage?: 'Lead' | 'Analyzing' | 'LOI' | 'Under DD' | 'Negotiating' | 'Closed' | 'Archived';
  deal_order?: number;

  // Property attributes
  property_class?: string;
  property_style?: string;
  property_subtype?: string;
  year_built?: string;
  units?: number;
  lot_size?: string;
  zoning?: string;
  parking_spaces?: number;
  acquisition_date?: string;
  strategy?: string;
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

  // Optional property attributes
  property_class?: string;
  property_style?: string;
  property_subtype?: string;
  year_built?: string;
  units?: number;
  lot_size?: string;
  zoning?: string;
  parking_spaces?: number;
  acquisition_date?: string;
  strategy?: string;
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
  deal_stage?: 'Lead' | 'Analyzing' | 'LOI' | 'Under DD' | 'Negotiating' | 'Closed' | 'Archived';
  deal_order?: number;

  // Property attributes
  property_class?: string;
  property_style?: string;
  property_subtype?: string;
  year_built?: string;
  units?: number;
  lot_size?: string;
  zoning?: string;
  parking_spaces?: number;
  acquisition_date?: string;
  strategy?: string;
}

export interface DealStageUpdate {
  new_stage: 'Lead' | 'Analyzing' | 'LOI' | 'Under DD' | 'Negotiating' | 'Closed' | 'Archived';
}

export interface DealStageOrderUpdate {
  new_stage: 'Lead' | 'Analyzing' | 'LOI' | 'Under DD' | 'Negotiating' | 'Closed' | 'Archived';
  order: number;
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
