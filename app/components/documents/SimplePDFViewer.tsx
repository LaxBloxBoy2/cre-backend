'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getFileUrl } from '@/lib/fileStorage';

interface SimplePDFViewerProps {
  pdfUrl: string;
  documentId: string;
  documentName: string;
  onDownload: (documentId: string) => void;
}

export default function SimplePDFViewer({
  pdfUrl,
  documentId,
  documentName,
  onDownload
}: SimplePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [actualPdfUrl, setActualPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the actual file from storage
    const storedFileUrl = getFileUrl(documentId);

    if (storedFileUrl && storedFileUrl.startsWith('data:application/pdf')) {
      // If we have a stored PDF file, use it
      setActualPdfUrl(storedFileUrl);
    } else {
      // Otherwise fall back to the sample PDF
      setActualPdfUrl(pdfUrl);
    }
  }, [documentId, pdfUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full">
        <div className="text-red-500 font-semibold mb-4">
          Failed to load PDF. Please try downloading the document instead.
        </div>
        <Button
          variant="outline"
          onClick={() => onDownload(documentId)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Document
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-background z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      )}

      {!actualPdfUrl ? (
        <div className="flex justify-center items-center h-[600px] bg-white rounded-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="relative w-full h-[600px] bg-white rounded-md overflow-hidden">
          {actualPdfUrl.startsWith('data:') ? (
            // For data URLs (uploaded files), use object tag which works better with data URLs
            <object
              data={actualPdfUrl}
              type="application/pdf"
              className="w-full h-full"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            >
              <p>Your browser does not support PDF viewing. Please download the PDF to view it.</p>
            </object>
          ) : (
            // For regular URLs (sample files), use iframe
            <iframe
              src={`${actualPdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={documentName}
            />
          )}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={() => onDownload(documentId)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
