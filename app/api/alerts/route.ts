import { NextRequest, NextResponse } from 'next/server';

// Mock data for alerts
const alerts = [
  {
    id: '1',
    deal_id: '1',
    deal_name: 'Office Building A',
    alert_type: 'Due Diligence',
    message: 'Due diligence deadline approaching',
    severity: 'high',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    resolved: false,
    user_id: '1',
    org_id: '1'
  },
  {
    id: '2',
    deal_id: '2',
    deal_name: 'Retail Center B',
    alert_type: 'Financing',
    message: 'Loan application deadline',
    severity: 'medium',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    resolved: false,
    user_id: '1',
    org_id: '1'
  },
  {
    id: '3',
    deal_id: '3',
    deal_name: 'Industrial Park C',
    alert_type: 'Inspection',
    message: 'Property inspection scheduled',
    severity: 'low',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    resolved: false,
    user_id: '1',
    org_id: '1'
  },
  {
    id: '4',
    deal_id: '1',
    deal_name: 'Office Building A',
    alert_type: 'Closing',
    message: 'Closing date confirmed',
    severity: 'high',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    resolved: false,
    user_id: '1',
    org_id: '1'
  }
];

// GET /api/alerts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dealId = searchParams.get('deal_id');
  const resolved = searchParams.get('resolved');
  
  let filteredAlerts = alerts;
  
  if (dealId) {
    filteredAlerts = filteredAlerts.filter(alert => alert.deal_id === dealId);
  }
  
  if (resolved !== null) {
    const isResolved = resolved === 'true';
    filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved);
  }
  
  return NextResponse.json({ alerts: filteredAlerts });
}
