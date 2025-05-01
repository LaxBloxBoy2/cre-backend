import { NextRequest, NextResponse } from 'next/server';

// Mock data for calendar events (shared with the main route)
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

// GET /api/calendar-events/[id]
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const event = calendarEvents.find(event => event.id === id);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json(event);
}

// PUT /api/calendar-events/[id]
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const body = await request.json();

  const eventIndex = calendarEvents.findIndex(event => event.id === id);

  if (eventIndex === -1) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const updatedEvent = {
    ...calendarEvents[eventIndex],
    ...body,
    updated_at: new Date().toISOString(),
  };

  calendarEvents[eventIndex] = updatedEvent;

  return NextResponse.json(updatedEvent);
}

// DELETE /api/calendar-events/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  const eventIndex = calendarEvents.findIndex(event => event.id === id);

  if (eventIndex === -1) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  calendarEvents.splice(eventIndex, 1);

  return NextResponse.json({ message: 'Event deleted successfully' });
}
