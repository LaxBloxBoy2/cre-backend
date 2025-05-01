import { NextRequest, NextResponse } from 'next/server';

// Import the mock database from the parent route
// In a real app, this would be a database connection
import { documentsDB } from '../route';

// DELETE /api/leases/[leaseId]/documents/[documentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leaseId: string; documentId: string } }
) {
  try {
    // Make a copy of the params to avoid the warning
    const leaseId = String(params.leaseId);
    const documentId = String(params.documentId);

    console.log(`API: Deleting document ${documentId} from lease ${leaseId}`);

    // Get existing documents
    const documents = documentsDB.get(leaseId) || [];

    // Filter out the document to delete
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);

    // Update the documents
    documentsDB.set(leaseId, updatedDocuments);

    console.log(`API: Document deleted successfully. Remaining documents: ${updatedDocuments.length}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
