// Document type definition
export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string | Date;
  uploadedBy: string;
  url?: string;
}

/**
 * Fetches documents for a lease
 * @param leaseId The ID of the lease
 * @returns A promise that resolves to an array of documents
 */
export async function fetchLeaseDocuments(leaseId: string): Promise<Document[]> {
  try {
    console.log(`Fetching documents for lease: ${leaseId}`);
    const response = await fetch(`/api/leases/${leaseId}/documents`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error response: ${errorText}`);
      throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Documents data received:', data);

    if (!data.documents || !Array.isArray(data.documents)) {
      console.error('Invalid documents data:', data);
      return [];
    }

    return data.documents.map((doc: any) => ({
      ...doc,
      uploadedAt: new Date(doc.uploadedAt)
    }));
  } catch (error) {
    console.error('Error fetching lease documents:', error);
    throw error;
  }
}

/**
 * Uploads a document for a lease
 * @param leaseId The ID of the lease
 * @param file The file to upload
 * @returns A promise that resolves to the uploaded document
 */
export async function uploadLeaseDocument(leaseId: string, file: File): Promise<Document> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/leases/${leaseId}/documents`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ...data.document,
      uploadedAt: new Date(data.document.uploadedAt)
    };
  } catch (error) {
    console.error('Error uploading lease document:', error);
    throw error;
  }
}

/**
 * Deletes a document
 * @param leaseId The ID of the lease
 * @param documentId The ID of the document to delete
 * @returns A promise that resolves to a boolean indicating success
 */
export async function deleteLeaseDocument(leaseId: string, documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/leases/${leaseId}/documents/${documentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting lease document:', error);
    throw error;
  }
}

/**
 * Views a document
 * @param documentUrl The URL of the document to view
 */
export function viewDocument(documentUrl: string): void {
  window.open(documentUrl, '_blank');
}

/**
 * Downloads a document
 * @param documentUrl The URL of the document to download
 * @param fileName The name to save the file as
 */
export function downloadDocument(documentUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = documentUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
