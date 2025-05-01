import { NextRequest, NextResponse } from 'next/server';

// Mock data for deals
const deals = [
  {
    id: '1',
    project_name: 'Office Building A',
    location: 'New York, NY',
    property_type: 'Office',
    acquisition_price: 5000000,
    construction_cost: 1000000,
    square_footage: 25000,
    projected_rent_per_sf: 45,
    vacancy_rate: 5,
    operating_expenses_per_sf: 15,
    exit_cap_rate: 6,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '1',
    org_id: '1'
  },
  {
    id: '2',
    project_name: 'Retail Center B',
    location: 'Los Angeles, CA',
    property_type: 'Retail',
    acquisition_price: 3500000,
    construction_cost: 500000,
    square_footage: 15000,
    projected_rent_per_sf: 35,
    vacancy_rate: 7,
    operating_expenses_per_sf: 12,
    exit_cap_rate: 5.5,
    status: 'in_review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '1',
    org_id: '1'
  },
  {
    id: '3',
    project_name: 'Industrial Park C',
    location: 'Chicago, IL',
    property_type: 'Industrial',
    acquisition_price: 7000000,
    construction_cost: 2000000,
    square_footage: 50000,
    projected_rent_per_sf: 25,
    vacancy_rate: 3,
    operating_expenses_per_sf: 8,
    exit_cap_rate: 5,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '1',
    org_id: '1'
  }
];

// GET /api/deals
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  
  let filteredDeals = deals;
  
  if (status) {
    filteredDeals = deals.filter(deal => deal.status === status);
  }
  
  return NextResponse.json({ deals: filteredDeals });
}
