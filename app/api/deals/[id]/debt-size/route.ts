import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cre-backend-0pvq.onrender.com';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id;
    const body = await request.json();
    
    // Get token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Forward request to backend API
    const response = await axios.post(
      `${API_URL}/api/deals/${dealId}/debt-size`,
      body,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error calculating debt sizing:', error.response?.data || error.message);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Failed to calculate debt sizing' },
      { status: error.response?.status || 500 }
    );
  }
}
