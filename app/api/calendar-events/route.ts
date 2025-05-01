import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Mock data for calendar events
let calendarEvents = [
  {
    id: '1',
    title: 'Due Diligence Deadline',
    description: 'Complete all due diligence tasks by this date',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    deal_id: '1',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'John Doe',
    event_type: 'deadline',
    all_day: true
  },
  {
    id: '2',
    title: 'Investor Meeting',
    description: 'Present deal to potential investors',
    start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    deal_id: '1',
    priority: 'medium',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'John Doe',
    event_type: 'custom',
    all_day: false
  },
  {
    id: '3',
    title: 'Closing Date',
    description: 'Final closing on property acquisition',
    start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Two weeks later
    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    deal_id: '2',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'Jane Smith',
    event_type: 'lifecycle',
    all_day: true
  },
  {
    id: '4',
    title: 'Market Research',
    description: 'Complete market analysis for new acquisition',
    start: new Date().toISOString(), // Today
    end: new Date().toISOString(),
    deal_id: '3',
    priority: 'low',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'Bob Johnson',
    event_type: 'custom',
    all_day: false
  }
];

// GET /api/calendar-events
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dealId = searchParams.get('deal_id');
  
  let filteredEvents = calendarEvents;
  
  if (dealId) {
    filteredEvents = calendarEvents.filter(event => event.deal_id === dealId);
  }
  
  return NextResponse.json({ events: filteredEvents });
}

// POST /api/calendar-events
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newEvent = {
    id: uuidv4(),
    ...body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'Current User', // In a real app, this would come from the authenticated user
  };
  
  calendarEvents.push(newEvent);
  
  return NextResponse.json(newEvent, { status: 201 });
}
