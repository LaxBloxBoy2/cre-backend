import { NextRequest, NextResponse } from 'next/server';

// Mock data for deal changes
const dealChanges = {
  '1': {
    deal_id: '1',
    deal_name: 'Office Building A',
    changes: [
      {
        id: '1',
        status: 'draft',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        created_by: 'John Doe'
      },
      {
        id: '2',
        status: 'in_review',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        created_by: 'Jane Smith'
      },
      {
        id: '3',
        status: 'approved',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        created_by: 'Bob Johnson'
      }
    ]
  },
  '2': {
    deal_id: '2',
    deal_name: 'Retail Center B',
    changes: [
      {
        id: '4',
        status: 'draft',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        created_by: 'John Doe'
      },
      {
        id: '5',
        status: 'in_review',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        created_by: 'Jane Smith'
      }
    ]
  },
  '3': {
    deal_id: '3',
    deal_name: 'Industrial Park C',
    changes: [
      {
        id: '6',
        status: 'draft',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        created_by: 'John Doe'
      }
    ]
  }
};

// GET /api/deals/[id]/changes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const changes = dealChanges[id as keyof typeof dealChanges];
  
  if (!changes) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }
  
  return NextResponse.json(changes);
}
