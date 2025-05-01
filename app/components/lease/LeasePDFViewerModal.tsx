'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { X, Download } from 'lucide-react';
import { Document } from '@/app/lib/services/document-service';

interface LeasePDFViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: Document) => void;
}

export default function LeasePDFViewerModal({
  document,
  isOpen,
  onClose,
  onDownload
}: LeasePDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (document && isOpen) {
      // For demo purposes, we'll use a sample PDF
      // In a real app, you would use the document's actual URL from the server
      let pdfPath = '/samples/lease-sample.pdf';

      // If we have a URL from the document, use that instead
      if (document.url) {
        pdfPath = document.url;
      }

      // Set the PDF URL
      setPdfUrl(pdfPath);
      setIsLoading(true);
      setHasError(false);
    } else {
      setPdfUrl(null);
    }
  }, [document, isOpen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-black dark:text-white">
            {document.name}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(document)}
              className="text-gray-700 dark:text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="text-gray-700 dark:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4 p-4 rounded bg-muted/20 dark:bg-muted/30">
          {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white/80 dark:bg-black/50 z-10 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {hasError ? (
            <div className="flex justify-center items-center h-[600px] bg-white dark:bg-gray-800 rounded-md">
              <div className="text-center p-4">
                <p className="text-red-500 dark:text-red-400 mb-2">Failed to load PDF</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(document)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[600px] bg-white dark:bg-gray-800 rounded-md overflow-hidden">
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title={document.name}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
