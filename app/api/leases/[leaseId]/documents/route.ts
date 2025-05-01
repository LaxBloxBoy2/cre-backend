import { NextRequest, NextResponse } from 'next/server';

// Mock database for documents - exported so it can be used by the [documentId] route
export const documentsDB = new Map<string, any[]>();

// Initialize with some mock data
documentsDB.set('lease-1', [
  {
    id: 'doc1',
    name: 'Lease Agreement.pdf',
    type: 'PDF',
    size: '2.4 MB',
    uploadedAt: new Date('2023-05-15').toISOString(),
    uploadedBy: 'John Smith',
    url: '/api/documents/doc1'
  },
  {
    id: 'doc2',
    name: 'Tenant Background Check.pdf',
    type: 'PDF',
    size: '1.8 MB',
    uploadedAt: new Date('2023-05-10').toISOString(),
    uploadedBy: 'Sarah Johnson',
    url: '/api/documents/doc2'
  },
  {
    id: 'doc3',
    name: 'Property Inspection Report.docx',
    type: 'DOCX',
    size: '3.2 MB',
    uploadedAt: new Date('2023-05-05').toISOString(),
    uploadedBy: 'Michael Brown',
    url: '/api/documents/doc3'
  }
]);

// GET /api/leases/[leaseId]/documents
export async function GET(
  request: NextRequest,
  { params }: { params: { leaseId: string } }
) {
  try {
    // In Next.js App Router, params should be used directly without awaiting
    // But we need to make a copy to avoid the warning
    const leaseId = String(params.leaseId);
    console.log(`API: Fetching documents for lease: ${leaseId}`);

    // Get documents for the lease
    const documents = documentsDB.get(leaseId) || [];
    console.log(`API: Found ${documents.length} documents`);

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/leases/[leaseId]/documents
export async function POST(
  request: NextRequest,
  { params }: { params: { leaseId: string } }
) {
  try {
    // Make a copy of the leaseId to avoid the warning
    const leaseId = String(params.leaseId);
    console.log(`API: Uploading document for lease: ${leaseId}`);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`API: Received file: ${file.name}, size: ${file.size} bytes`);

    // In a real app, you would upload the file to a storage service
    // and save the metadata to a database

    // Create a new document
    const newDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
      url: `/api/documents/${Date.now()}`
    };

    // Get existing documents
    const documents = documentsDB.get(leaseId) || [];

    // Add the new document
    documentsDB.set(leaseId, [...documents, newDocument]);

    console.log(`API: Document uploaded successfully with ID: ${newDocument.id}`);

    return NextResponse.json({ document: newDocument }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Note: DELETE method has been moved to [documentId]/route.ts
