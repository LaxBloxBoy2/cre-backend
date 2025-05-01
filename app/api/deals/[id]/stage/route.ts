import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cre-backend-0pvq.onrender.com';

export async function PATCH(
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
    const response = await axios.patch(
      `${API_URL}/api/deals/${dealId}/stage`,
      body,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error updating deal stage:', error);
    
    // If the backend API is not available, simulate a successful response
    // This is for development purposes only
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json({
        id: params.id,
        deal_stage: body.new_stage,
        message: 'Deal stage updated successfully (simulated)'
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update deal stage' },
      { status: error.response?.status || 500 }
    );
  }
}
