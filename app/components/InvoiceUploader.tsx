'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { FileUpload } from './ui/FileUpload';
import { Button } from './ui/button';
import { useToast } from '../contexts/ToastContext';
import { uploadInvoice } from '../lib/invoice-api';
import { Invoice } from '../types/invoice';
import { Loader2 } from 'lucide-react';

interface InvoiceUploaderProps {
  dealId: string;
  onUploadComplete: (invoice: Invoice) => void;
}

export function InvoiceUploader({ dealId, onUploadComplete }: InvoiceUploaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const handleFileSelect = (file: File) => {
    // Only accept PDF files
    if (file.type !== 'application/pdf') {
      showToast("Please select a PDF file", "error");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a PDF invoice to upload", "error");
      return;
    }

    try {
      // Reset progress
      setExtractionProgress(0);

      // Start uploading
      setIsUploading(true);
      showToast("Uploading invoice...", "info");

      // Simulate upload progress
      const uploadTimer = setInterval(() => {
        setExtractionProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 30) {
            clearInterval(uploadTimer);
          }
          return newProgress < 30 ? newProgress : 30;
        });
      }, 100);

      // Upload file (simulate delay)
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(uploadTimer);

      // Start OCR processing
      setIsProcessing(true);
      setExtractionProgress(30);
      showToast("Extracting invoice data using OCR...", "info");

      // Simulate OCR progress
      const ocrTimer = setInterval(() => {
        setExtractionProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 90) {
            clearInterval(ocrTimer);
          }
          return newProgress < 90 ? newProgress : 90;
        });
      }, 100);

      // Call API to upload and parse invoice
      const invoice = await uploadInvoice(dealId, selectedFile);

      // Complete progress
      clearInterval(ocrTimer);
      setExtractionProgress(100);

      // Show success message
      showToast(`Invoice processed successfully. Extracted ${invoice.line_items.length} line items`, "success");

      // Reset state after a short delay to show 100% completion
      setTimeout(() => {
        setSelectedFile(null);
        setIsUploading(false);
        setIsProcessing(false);
        setExtractionProgress(0);

        // Notify parent component
        onUploadComplete(invoice);
      }, 500);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      showToast("Failed to upload and process invoice", "error");
      setIsUploading(false);
      setIsProcessing(false);
      setExtractionProgress(0);
    }
  };

  return (
    <div className="space-y-4 p-6 rounded-lg border-2 border-accent/30" style={{
      backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
    }}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Upload PDF Invoice
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upload a PDF invoice to automatically extract vendor information, invoice number, date, and line items using OCR technology.
        </p>
      </div>

      <FileUpload
        onFileSelect={handleFileSelect}
        accept=".pdf,application/pdf"
        maxSize={10 * 1024 * 1024} // 10MB
        label="Upload PDF Invoice"
        description="Drag and drop a PDF invoice here, or click to select a file"
        disabled={isUploading || isProcessing}
        className="border-2 border-dashed"
      />

      {selectedFile && (
        <div className="flex items-center p-3 rounded-md" style={{
          backgroundColor: isDark ? 'var(--bg-card-hover)' : 'var(--bg-card-hover-light)',
        }}>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {(isUploading || isProcessing) && (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isUploading && !isProcessing
                ? 'Uploading invoice...'
                : isProcessing
                  ? 'Extracting text and data using OCR...'
                  : 'Processing...'}
            </p>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
              {extractionProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div className="bg-accent h-2 rounded-full" style={{
              width: `${extractionProgress}%`,
              transition: 'width 0.3s ease-in-out'
            }}></div>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {extractionProgress < 30
              ? 'Uploading file...'
              : extractionProgress < 60
                ? 'Extracting text from PDF...'
                : extractionProgress < 90
                  ? 'Identifying invoice data and line items...'
                  : 'Finalizing invoice...'}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isProcessing}
          className="bg-accent hover:bg-accent/90 text-white"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Upload & Process Invoice'
          )}
        </Button>
      </div>
    </div>
  );
}
