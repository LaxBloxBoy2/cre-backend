export interface Document {
  id: string;
  name: string;
  doc_type?: string;
  type?: string;
  note?: string;
  file_path?: string;
  file_type?: string;
  size?: number;
  category?: string;
  description?: string;
  upload_timestamp?: string;
  uploaded_at?: string;
  ai_summary?: string;
  deal_id?: string;
  deal_name?: string;
  user_id?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  red_flags?: RedFlag[] | string;
}

export interface RedFlag {
  id?: string;
  text?: string;
  clause?: string;
  risk_summary?: string;
  explanation?: string;
  severity: 'red' | 'yellow' | 'high' | 'medium';
  page?: number;
  position?: { start: number; end: number };
}

export interface DocumentSummaryResponse {
  id: string;
  summary: string;
  status: string;
}

export interface RedFlagScanResponse {
  id: string;
  red_flags: RedFlag[];
  status: string;
}
