'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Upload, Download, Trash2, Eye, File, FileImage, FileSpreadsheet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/app/contexts/ToastContext';
import {
  Document,
  fetchLeaseDocuments,
  uploadLeaseDocument,
  deleteLeaseDocument,
  viewDocument,
  downloadDocument
} from '@/app/lib/services/document-service';
import DocumentViewerModal from '@/components/documents/DocumentViewerModal';
import PDFViewerModal from '@/components/documents/PDFViewerModal';

// Fallback mock data in case the API fails
const getMockDocuments = (leaseId: string): Document[] => {
  return [
    {
      id: 'mock-doc1',
      name: 'Lease Agreement.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedAt: new Date('2023-05-15'),
      uploadedBy: 'John Smith',
      url: '/samples/lease-sample.pdf'
    },
    {
      id: 'mock-doc2',
      name: 'Tenant Background Check.pdf',
      type: 'PDF',
      size: '1.8 MB',
      uploadedAt: new Date('2023-05-10'),
      uploadedBy: 'Sarah Johnson',
      url: '/samples/lease-sample.pdf'
    },
    {
      id: 'mock-doc3',
      name: 'Property Inspection Report.docx',
      type: 'DOCX',
      size: '3.2 MB',
      uploadedAt: new Date('2023-05-05'),
      uploadedBy: 'Michael Brown',
      url: '/samples/lease-sample.pdf'
    }
  ];
};

// Helper function to check if a file is a PDF
const isPDF = (filename: string): boolean => {
  return filename.toLowerCase().endsWith('.pdf');
};

interface LeaseDocumentsProps {
  leaseId: string;
}

export function LeaseDocuments({ leaseId }: LeaseDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Fetch documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        console.log(`LeaseDocuments component: Loading documents for lease ${leaseId}`);

        // Add a small delay to ensure the API route is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        const docs = await fetchLeaseDocuments(leaseId);
        console.log('Documents loaded successfully:', docs);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load documents. Please try again later.',
          variant: 'destructive'
        });
        // Use fallback mock data to avoid showing empty state
        console.log('Using fallback mock documents');
        setDocuments(getMockDocuments(leaseId));
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [leaseId, showToast]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];

      // Upload the file
      const newDoc = await uploadLeaseDocument(leaseId, file);

      // Add the new document to the list
      setDocuments([...documents, newDoc]);

      showToast({
        title: 'Success',
        description: 'Document uploaded successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteLeaseDocument(leaseId, docId);
        setDocuments(documents.filter(doc => doc.id !== docId));

        showToast({
          title: 'Success',
          description: 'Document deleted successfully',
          variant: 'success'
        });
      } catch (error) {
        console.error('Error deleting document:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete document',
          variant: 'destructive'
        });
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'DOCX':
      case 'DOC':
        return <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'XLSX':
      case 'XLS':
      case 'CSV':
        return <FileSpreadsheet className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'JPG':
      case 'JPEG':
      case 'PNG':
      case 'GIF':
        return <FileImage className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      default:
        return <File className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      if (doc.url) {
        downloadDocument(doc.url, doc.name);
      } else {
        showToast({
          title: 'Error',
          description: 'Download URL not available',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  const handleView = (doc: Document) => {
    try {
      setViewingDocument(doc);

      // If it's a PDF, open the PDF viewer, otherwise open the regular document viewer
      if (isPDF(doc.name)) {
        setIsPDFViewerOpen(true);
      } else {
        setIsDocumentViewerOpen(true);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      showToast({
        title: 'Error',
        description: 'Failed to view document',
        variant: 'destructive'
      });
    }
  };

  // Handle closing the document viewer
  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setViewingDocument(null);
  };

  // Handle closing the PDF viewer
  const handleClosePDFViewer = () => {
    setIsPDFViewerOpen(false);
    setViewingDocument(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Lease Documents
        </CardTitle>
        <div>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Document Viewer Modals */}
        <DocumentViewerModal
          document={viewingDocument}
          isOpen={isDocumentViewerOpen}
          onClose={handleCloseDocumentViewer}
          onDownload={(documentId) => handleDownload(viewingDocument!)}
        />

        <PDFViewerModal
          document={viewingDocument}
          isOpen={isPDFViewerOpen}
          onClose={handleClosePDFViewer}
          onDownload={(documentId) => handleDownload(viewingDocument!)}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-600 dark:text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-muted/30 rounded-lg border border-border shadow-sm">
                <div className="flex items-center">
                  {getFileIcon(doc.type)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.size} • Uploaded {formatDistanceToNow(doc.uploadedAt, { addSuffix: true })} by {doc.uploadedBy}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center text-gray-700 dark:text-gray-300"
                    onClick={() => handleView(doc)}
                    style={{
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-muted)',
                      padding: '0 8px',
                      height: '28px'
                    }}
                  >
                    {isPDF(doc.name) ? (
                      <FileText className="h-4 w-4 mr-1" />
                    ) : (
                      <FileText className="h-4 w-4 mr-1" />
                    )}
                    {isPDF(doc.name) ? 'View PDF' : 'View'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleDownload(doc)}
                    style={{
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-muted)',
                      padding: '0 8px',
                      height: '28px'
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      borderColor: 'var(--border-dark)',
                      backgroundColor: 'var(--destructive-light)',
                      color: 'var(--destructive)',
                      padding: '0 8px',
                      height: '28px',
                      width: '32px'
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 dark:text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No documents yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload documents related to this lease
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{
                borderColor: 'var(--border-dark)',
                color: 'var(--text-muted)'
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
