'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../contexts/ToastContext';
import { getDocuments, downloadDocument, deleteDocument, deleteMultipleDocuments } from '../../lib/api';
import FileUpload from '../../components/FileUpload';
import TrashIcon from '../../components/icons/TrashIcon';
import { Search, FileText, AlertTriangle, FileIcon } from 'lucide-react';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import PDFViewerModal from '../../components/documents/PDFViewerModal';
import { getFile, getFileUrl, getFileBlob, deleteFile } from '../../lib/fileStorage';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  description?: string;
  deal_id: string;
  deal_name: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function DocRoomPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const { showToast } = useToast();

  // Helper function to check if a file is a PDF
  const isPDF = (filename: string): boolean => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  // Check if the user has previously chosen to skip delete confirmations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const skipConfirm = localStorage.getItem('skipDeleteConfirm') === 'true';
      setSkipDeleteConfirm(skipConfirm);
    }
  }, []);

  // Fetch documents
  const fetchDocuments = async () => {
    console.log('Fetching documents...');
    try {
      setIsLoading(true);

      // Clear localStorage cache if needed (for testing)
      // localStorage.removeItem('demo_documents');

      const docs = await getDocuments();
      console.log('Documents fetched:', docs);

      // Check if we got any documents
      if (docs && Array.isArray(docs)) {
        console.log(`Received ${docs.length} documents`);
        setDocuments(docs);
      } else {
        console.warn('No documents received or invalid format:', docs);
        setDocuments([]);
      }

      // Show success toast when refreshing after upload
      if (!isLoading) {
        showToast('Document list refreshed', 'success');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
      // Set empty array to avoid undefined errors
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document refresh
  const handleRefresh = () => {
    console.log('Manually refreshing document list');
    fetchDocuments();
  };

  // Load documents on mount and set up refresh mechanism
  useEffect(() => {
    console.log('Component mounted, initializing demo data');

    // Set demo token if not already set
    if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      console.log('Setting demo token for document access');
      localStorage.setItem('accessToken', 'demo_access_token');
      localStorage.setItem('refreshToken', 'demo_refresh_token');
    }

    // Create demo document if none exists
    if (typeof window !== 'undefined' && !localStorage.getItem('demo_documents')) {
      console.log('Creating demo documents');
      const demoDocuments = [
        {
          id: '1',
          name: 'Lease Agreement.pdf',
          type: 'Lease',
          size: 2457600,
          category: 'lease',
          description: 'Main lease agreement',
          deal_id: '1',
          deal_name: 'Office Tower A',
          uploaded_at: '2023-12-01T00:00:00Z',
          uploaded_by: 'John Doe'
        },
        {
          id: '2',
          name: 'Financial Model.xlsx',
          type: 'Financial',
          size: 1843200,
          category: 'financial',
          description: 'Financial projections',
          deal_id: '1',
          deal_name: 'Office Tower A',
          uploaded_at: '2023-12-02T00:00:00Z',
          uploaded_by: 'Jane Smith'
        },
        {
          id: '3',
          name: 'Property Report.pdf',
          type: 'Report',
          size: 3145728,
          category: 'financial',
          description: 'Detailed property analysis report',
          deal_id: '1',
          deal_name: 'Office Tower A',
          uploaded_at: '2023-12-03T00:00:00Z',
          uploaded_by: 'Robert Johnson'
        },
        {
          id: '4',
          name: 'Market Analysis.pdf',
          type: 'Analysis',
          size: 1572864,
          category: 'market',
          description: 'Market trends and analysis',
          deal_id: '1',
          deal_name: 'Office Tower A',
          uploaded_at: '2023-12-04T00:00:00Z',
          uploaded_by: 'Sarah Williams'
        }
      ];
      localStorage.setItem('demo_documents', JSON.stringify(demoDocuments));
    }

    console.log('Fetching initial documents');
    fetchDocuments();

    // Set up an interval to periodically refresh the document list
    // This helps ensure we catch any documents added by other users or processes
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing document list');
      fetchDocuments();
    }, 15000); // Refresh every 15 seconds

    // Set up a storage event listener to detect changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'demo_documents') {
        console.log('Detected localStorage change for documents, refreshing');
        fetchDocuments();
      }
    };

    // Add the storage event listener
    window.addEventListener('storage', handleStorageChange);

    // Clean up the interval and event listener when the component unmounts
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle document download
  const handleDownload = async (documentId: string) => {
    try {
      // Find the document
      const doc = documents.find(d => d.id === documentId);
      if (!doc) {
        throw new Error('Document not found');
      }

      // Check if we have the actual file stored
      const storedFile = getFile(documentId);

      if (storedFile) {
        // If we have the actual file, create a blob URL and download it
        const fileBlob = getFileBlob(documentId);

        if (fileBlob) {
          const blobUrl = URL.createObjectURL(fileBlob);

          // Create a link and trigger download
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          URL.revokeObjectURL(blobUrl);

          showToast('Document download started', 'success');
          return;
        }
      }

      // Fallback to sample PDFs if no stored file is found
      let pdfPath = '/samples/sample.pdf';

      // Use different sample PDFs based on document name
      if (doc.name.includes('Lease')) {
        pdfPath = '/samples/lease-sample.pdf';
      } else if (doc.name.includes('Property')) {
        pdfPath = '/samples/property-sample.pdf';
      } else if (doc.name.includes('Market')) {
        pdfPath = '/samples/market-sample.pdf';
      }

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = pdfPath;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Document download started', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('Failed to download document', 'error');
    }
  };

  // Handle document selection
  const handleSelectDocument = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  // Handle select all documents
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allDocumentIds = filteredDocuments.map(doc => doc.id);
      setSelectedDocuments(allDocumentIds);
    } else {
      setSelectedDocuments([]);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedDocuments.length === 0) return;

    if (skipDeleteConfirm) {
      handleDeleteDocuments();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Handle document deletion
  const handleDeleteDocuments = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      setIsLoading(true);

      // Delete documents from API
      if (selectedDocuments.length === 1) {
        // Delete single document
        await deleteDocument(selectedDocuments[0]);

        // Delete the actual stored file
        deleteFile(selectedDocuments[0]);

        showToast('Document deleted successfully', 'success');
      } else {
        // Delete multiple documents
        const result = await deleteMultipleDocuments(selectedDocuments);

        // Delete the actual stored files
        for (const docId of selectedDocuments) {
          deleteFile(docId);
        }

        showToast(`${result.deletedCount || selectedDocuments.length} documents deleted successfully`, 'success');
      }

      // Update local storage for demo mode
      if (typeof window !== 'undefined') {
        try {
          const currentDocs = localStorage.getItem('demo_documents');
          if (currentDocs) {
            const parsedDocs = JSON.parse(currentDocs);
            const filteredDocs = parsedDocs.filter((doc: Document) => !selectedDocuments.includes(doc.id));
            localStorage.setItem('demo_documents', JSON.stringify(filteredDocs));
          }
        } catch (error) {
          console.error('Error updating localStorage after deletion:', error);
        }
      }

      // Clear selection and refresh document list
      setSelectedDocuments([]);
      setShowDeleteConfirm(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting documents:', error);
      showToast('Failed to delete documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Don't show again" option
  const handleSkipConfirmChange = (skip: boolean) => {
    setSkipDeleteConfirm(skip);
    if (typeof window !== 'undefined') {
      localStorage.setItem('skipDeleteConfirm', skip ? 'true' : 'false');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle opening the document viewer
  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);

    // If it's a PDF, open the PDF viewer, otherwise open the regular document viewer
    if (isPDF(document.name)) {
      setIsPDFViewerOpen(true);
    } else {
      setIsDocumentViewerOpen(true);
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

  // Handle scanning a lease document
  const handleScanLease = (documentId: string) => {
    // Navigate to the document page with the scan tab active
    router.push(`/tools/doc-room/${documentId}?action=scan`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Doc Room</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            style={{
              borderColor: 'var(--border-dark)',
              color: 'var(--text-muted)'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteConfirm}
            disabled={isLoading || selectedDocuments.length === 0}
            style={{
              borderColor: 'var(--border-dark)',
              backgroundColor: selectedDocuments.length > 0 ? 'var(--destructive-light)' : 'transparent',
              color: selectedDocuments.length > 0 ? 'var(--destructive)' : 'var(--text-muted)',
              opacity: selectedDocuments.length > 0 ? 1 : 0.5,
              marginRight: '8px'
            }}
            title="Delete selected documents"
          >
            <TrashIcon size={18} />
            {selectedDocuments.length > 0 && (
              <span className="ml-1">{selectedDocuments.length}</span>
            )}
          </Button>
          <FileUpload onSuccess={fetchDocuments} />
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={viewingDocument}
        isOpen={isDocumentViewerOpen}
        onClose={handleCloseDocumentViewer}
        onDownload={handleDownload}
      />

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        document={viewingDocument}
        isOpen={isPDFViewerOpen}
        onClose={handleClosePDFViewer}
        onDownload={handleDownload}
      />

      <div className="mb-6">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            borderColor: 'var(--border-dark)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      {/* Document Tabs */}
      <div className="w-full space-y-6">
        {/* Lease Documents Section */}
        <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Lease Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Loading documents...
              </div>
            ) : filteredDocuments.filter(doc => doc.category === 'lease').length === 0 ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? 'No lease documents match your search.' : 'No lease documents found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <th className="w-10 py-3 px-2">
                        <Checkbox
                          checked={
                            filteredDocuments.filter(doc => doc.category === 'lease').length > 0 &&
                            filteredDocuments.filter(doc => doc.category === 'lease').every(doc => selectedDocuments.includes(doc.id))
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const leaseDocIds = filteredDocuments
                                .filter(doc => doc.category === 'lease')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => [...prev.filter(id => !leaseDocIds.includes(id)), ...leaseDocIds]);
                            } else {
                              const leaseDocIds = filteredDocuments
                                .filter(doc => doc.category === 'lease')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => prev.filter(id => !leaseDocIds.includes(id)));
                            }
                          }}
                          style={{
                            borderColor: 'var(--border-dark)',
                            backgroundColor: filteredDocuments.filter(doc => doc.category === 'lease').every(doc => selectedDocuments.includes(doc.id))
                              ? 'var(--accent)'
                              : 'transparent'
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Size</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Deal</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Uploaded</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments
                      .filter(doc => doc.category === 'lease')
                      .map((doc) => (
                        <tr key={doc.id} style={{
                          borderBottom: '1px solid var(--border-dark)',
                          backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--bg-card-hover)' : 'transparent'
                        }}>
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={(checked) => handleSelectDocument(doc.id, checked === true)}
                              style={{
                                borderColor: 'var(--border-dark)',
                                backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--accent)' : 'transparent'
                              }}
                            />
                          </td>
                          <td
                            className="py-3 px-2 cursor-pointer hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                            onClick={() => router.push(`/tools/doc-room/${doc.id}`)}
                          >
                            {doc.name}
                          </td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{doc.type}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.size)}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{doc.deal_name}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.uploaded_at)}</td>
                          <td className="py-3 px-2">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleViewDocument(doc)}
                              >
                                {isPDF(doc.name) ? (
                                  <FileIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1" />
                                )}
                                {isPDF(doc.name) ? 'View PDF' : 'View'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  backgroundColor: 'var(--bg-card-hover)',
                                  color: 'var(--accent)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleScanLease(doc.id)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Scan Lease
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleDownload(doc.id)}
                              >
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  backgroundColor: 'var(--destructive-light)',
                                  color: 'var(--destructive)',
                                  padding: '0 8px',
                                  height: '28px',
                                  width: '32px'
                                }}
                                onClick={() => {
                                  setSelectedDocuments([doc.id]);
                                  handleDeleteConfirm();
                                }}
                                title="Delete document"
                              >
                                <TrashIcon size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Documents Section */}
        <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Financial Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Loading documents...
              </div>
            ) : filteredDocuments.filter(doc => doc.category === 'financial').length === 0 ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? 'No financial documents match your search.' : 'No financial documents found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <th className="w-10 py-3 px-2">
                        <Checkbox
                          checked={
                            filteredDocuments.filter(doc => doc.category === 'financial').length > 0 &&
                            filteredDocuments.filter(doc => doc.category === 'financial').every(doc => selectedDocuments.includes(doc.id))
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const financialDocIds = filteredDocuments
                                .filter(doc => doc.category === 'financial')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => [...prev.filter(id => !financialDocIds.includes(id)), ...financialDocIds]);
                            } else {
                              const financialDocIds = filteredDocuments
                                .filter(doc => doc.category === 'financial')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => prev.filter(id => !financialDocIds.includes(id)));
                            }
                          }}
                          style={{
                            borderColor: 'var(--border-dark)',
                            backgroundColor: filteredDocuments.filter(doc => doc.category === 'financial').every(doc => selectedDocuments.includes(doc.id))
                              ? 'var(--accent)'
                              : 'transparent'
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Size</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Deal</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Uploaded</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments
                      .filter(doc => doc.category === 'financial')
                      .map((doc) => (
                        <tr key={doc.id} style={{
                          borderBottom: '1px solid var(--border-dark)',
                          backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--bg-card-hover)' : 'transparent'
                        }}>
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={(checked) => handleSelectDocument(doc.id, checked === true)}
                              style={{
                                borderColor: 'var(--border-dark)',
                                backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--accent)' : 'transparent'
                              }}
                            />
                          </td>
                          <td
                            className="py-3 px-2 cursor-pointer hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                            onClick={() => router.push(`/tools/doc-room/${doc.id}`)}
                          >
                            {doc.name}
                          </td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{doc.type}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.size)}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{doc.deal_name}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.uploaded_at)}</td>
                          <td className="py-3 px-2">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleViewDocument(doc)}
                              >
                                {isPDF(doc.name) ? (
                                  <FileIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1" />
                                )}
                                {isPDF(doc.name) ? 'View PDF' : 'View'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleDownload(doc.id)}
                              >
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  backgroundColor: 'var(--destructive-light)',
                                  color: 'var(--destructive)',
                                  padding: '0 8px',
                                  height: '28px',
                                  width: '32px'
                                }}
                                onClick={() => {
                                  setSelectedDocuments([doc.id]);
                                  handleDeleteConfirm();
                                }}
                                title="Delete document"
                              >
                                <TrashIcon size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Documents Section */}
        <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>Other Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Loading documents...
              </div>
            ) : filteredDocuments.filter(doc => doc.category !== 'lease' && doc.category !== 'financial').length === 0 ? (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? 'No other documents match your search.' : 'No other documents found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <th className="w-10 py-3 px-2">
                        <Checkbox
                          checked={
                            filteredDocuments.filter(doc => doc.category !== 'lease' && doc.category !== 'financial').length > 0 &&
                            filteredDocuments.filter(doc => doc.category !== 'lease' && doc.category !== 'financial').every(doc => selectedDocuments.includes(doc.id))
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const otherDocIds = filteredDocuments
                                .filter(doc => doc.category !== 'lease' && doc.category !== 'financial')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => [...prev.filter(id => !otherDocIds.includes(id)), ...otherDocIds]);
                            } else {
                              const otherDocIds = filteredDocuments
                                .filter(doc => doc.category !== 'lease' && doc.category !== 'financial')
                                .map(doc => doc.id);
                              setSelectedDocuments(prev => prev.filter(id => !otherDocIds.includes(id)));
                            }
                          }}
                          style={{
                            borderColor: 'var(--border-dark)',
                            backgroundColor: filteredDocuments.filter(doc => doc.category !== 'lease' && doc.category !== 'financial').every(doc => selectedDocuments.includes(doc.id))
                              ? 'var(--accent)'
                              : 'transparent'
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Size</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Category</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Uploaded</th>
                      <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments
                      .filter(doc => doc.category !== 'lease' && doc.category !== 'financial')
                      .map((doc) => (
                        <tr key={doc.id} style={{
                          borderBottom: '1px solid var(--border-dark)',
                          backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--bg-card-hover)' : 'transparent'
                        }}>
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={(checked) => handleSelectDocument(doc.id, checked === true)}
                              style={{
                                borderColor: 'var(--border-dark)',
                                backgroundColor: selectedDocuments.includes(doc.id) ? 'var(--accent)' : 'transparent'
                              }}
                            />
                          </td>
                          <td
                            className="py-3 px-2 cursor-pointer hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                            onClick={() => router.push(`/tools/doc-room/${doc.id}`)}
                          >
                            {doc.name}
                          </td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{doc.type}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.size)}</td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>
                            {doc.category.charAt(0).toUpperCase() + doc.category.slice(1).replace('_', ' ')}
                          </td>
                          <td className="py-3 px-2" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.uploaded_at)}</td>
                          <td className="py-3 px-2">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleViewDocument(doc)}
                              >
                                {isPDF(doc.name) ? (
                                  <FileIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1" />
                                )}
                                {isPDF(doc.name) ? 'View PDF' : 'View'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  color: 'var(--text-muted)',
                                  padding: '0 8px',
                                  height: '28px'
                                }}
                                onClick={() => handleDownload(doc.id)}
                              >
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: 'var(--border-dark)',
                                  backgroundColor: 'var(--destructive-light)',
                                  color: 'var(--destructive)',
                                  padding: '0 8px',
                                  height: '28px',
                                  width: '32px'
                                }}
                                onClick={() => {
                                  setSelectedDocuments([doc.id]);
                                  handleDeleteConfirm();
                                }}
                                title="Delete document"
                              >
                                <TrashIcon size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to delete {selectedDocuments.length === 1 ? 'this document' : `these ${selectedDocuments.length} documents`}?
              This action cannot be undone.
            </p>
            <div className="flex items-center mt-4">
              <Checkbox
                id="skipConfirm"
                checked={skipDeleteConfirm}
                onCheckedChange={(checked) => handleSkipConfirmChange(checked === true)}
                style={{
                  borderColor: 'var(--border-dark)',
                  backgroundColor: skipDeleteConfirm ? 'var(--accent)' : 'transparent'
                }}
              />
              <label
                htmlFor="skipConfirm"
                className="ml-2 text-sm cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                Don't show this confirmation again
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                borderColor: 'var(--border-dark)',
                color: 'var(--text-muted)'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocuments}
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--destructive)',
                color: 'white'
              }}
            >
              {isLoading ? (
                'Deleting...'
              ) : (
                <div className="flex items-center">
                  <TrashIcon size={16} className="mr-2" />
                  Delete
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
