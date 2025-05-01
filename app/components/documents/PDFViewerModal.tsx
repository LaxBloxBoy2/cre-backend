'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { Document } from '@/types/document';
import SimplePDFViewer from './SimplePDFViewer';

interface PDFViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (documentId: string) => void;
}

export default function PDFViewerModal({
  document,
  isOpen,
  onClose,
  onDownload
}: PDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (document && isOpen) {
      // For demo purposes, we'll use a local sample PDF based on the document name
      // In a real app, you would use the document's actual URL from the server
      let pdfPath = '/samples/sample.pdf';

      // Use different sample PDFs based on document name to simulate different documents
      if (document.name.includes('Lease')) {
        pdfPath = '/samples/lease-sample.pdf';
      } else if (document.name.includes('Property')) {
        pdfPath = '/samples/property-sample.pdf';
      } else if (document.name.includes('Market')) {
        pdfPath = '/samples/market-sample.pdf';
      }

      // Set the PDF URL
      setPdfUrl(pdfPath);
    } else {
      setPdfUrl(null);
    }
  }, [document, isOpen]);

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        color: 'var(--text-primary)'
      }}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {document.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(document.id)}
              style={{
                borderColor: 'var(--border-dark)',
                color: 'var(--text-muted)'
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              style={{
                borderColor: 'var(--border-dark)',
                color: 'var(--text-muted)'
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4 p-4 rounded" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          {pdfUrl ? (
            <SimplePDFViewer
              pdfUrl={pdfUrl}
              documentId={document.id}
              documentName={document.name}
              onDownload={onDownload}
            />
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
