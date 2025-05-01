export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  deal_id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  line_items: LineItem[];
  original_pdf_url: string;
}
