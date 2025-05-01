import { NextRequest, NextResponse } from 'next/server';

// This is a mock API route for document viewing/downloading
// In a real app, this would fetch the document from a storage service

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // In a real app, you would fetch the document from a storage service
    // For now, we'll just return a mock response
    
    // Create a simple text document as a mock
    const mockDocument = `This is a mock document with ID: ${id}
    
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, 
nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies
nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl
nisl aliquam nisl, eget ultricies nisl nisl eget nisl.

Document ID: ${id}
Created: ${new Date().toISOString()}
`;
    
    // Set the content type based on the document ID
    let contentType = 'text/plain';
    if (id === 'doc1' || id === 'doc2') {
      contentType = 'application/pdf';
    } else if (id === 'doc3') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // Return the mock document
    return new NextResponse(mockDocument, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="document-${id}.txt"`
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
