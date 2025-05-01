'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  upload_date: string;
  file_size: number;
  analysis?: {
    base_rent?: string;
    lease_term?: string;
    renewal_options?: string[];
    break_clauses?: string[];
    red_flags?: string[];
    summary?: string;
  };
}

interface DocumentsTabProps {
  dealId: string;
}

export default function DocumentsTab({ dealId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF and DOCX files are allowed');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // In a real app, we would call the API
      // For now, we'll simulate an upload

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 300);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clear progress interval if it's still running
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create a mock document
      const newDocument: Document = {
        id: Math.random().toString(36).substring(2, 9),
        filename: file.name,
        file_type: file.type === 'application/pdf' ? 'pdf' : 'docx',
        upload_date: new Date().toISOString(),
        file_size: file.size,
      };

      setDocuments(prev => [...prev, newDocument]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Simulate lease analysis
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update document with analysis
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === newDocument.id
            ? {
                ...doc,
                analysis: {
                  base_rent: '$45 per square foot',
                  lease_term: '5 years',
                  renewal_options: ['Two 5-year options at market rate'],
                  break_clauses: ['Tenant may terminate after year 3 with 6 months notice and penalty'],
                  red_flags: ['Security deposit below market standard', 'Unusual CAM exclusions'],
                  summary: 'Standard office lease with below-market security deposit and favorable renewal options for tenant.',
                },
              }
            : doc
        )
      );

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg leading-6 font-medium text-white">Documents</h3>
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105 ${
              isUploading ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' : 'cursor-pointer'
            }`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Lease
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={isUploading}
              ref={fileInputRef}
            />
          </label>
        </div>

        {isUploading && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-text-secondary">Uploading...</span>
              <span className="text-sm font-medium text-white">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-dark-card-hover rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-[#30E3CA] to-[#11999E] h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-text-secondary">Analyzing lease document...</span>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
            </div>
            <div className="w-full bg-dark-card-hover rounded-full h-2.5">
              <div className="bg-gradient-to-r from-[#30E3CA] to-[#11999E] h-2.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-6 bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{uploadError}</span>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="border-t border-dark-card-hover pt-4">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No documents</h3>
              <p className="mt-1 text-sm text-text-secondary">Get started by uploading a document.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border-r border-dark-card-hover pr-6">
              <h4 className="text-md font-medium text-white mb-4">Document List</h4>
              <ul className="divide-y divide-dark-card-hover">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className={`py-4 cursor-pointer hover:bg-dark-card-hover transition-colors duration-200 ${
                      selectedDocument?.id === doc.id ? 'bg-dark-card-hover border-l-2 border-accent pl-2' : ''
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-10 w-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                        <div className="flex text-xs text-text-secondary">
                          <span>{formatDate(doc.upload_date)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="mx-1">•</span>
                          <span className="uppercase">{doc.file_type}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              {selectedDocument ? (
                <div>
                  <h4 className="text-md font-medium text-white mb-4">Lease Analysis</h4>

                  {selectedDocument.analysis ? (
                    <div className="bg-dark-card-hover rounded-lg border border-dark-card-hover p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-card-dark p-3 rounded-md shadow-lg">
                          <h5 className="text-sm font-medium text-text-secondary mb-2">Base Rent</h5>
                          <p className="text-sm text-white">{selectedDocument.analysis.base_rent}</p>
                        </div>
                        <div className="bg-card-dark p-3 rounded-md shadow-lg">
                          <h5 className="text-sm font-medium text-text-secondary mb-2">Lease Term</h5>
                          <p className="text-sm text-white">{selectedDocument.analysis.lease_term}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-text-secondary mb-2">Renewal Options</h5>
                        <ul className="bg-card-dark p-3 rounded-md shadow-lg list-disc pl-5">
                          {selectedDocument.analysis.renewal_options?.map((option, index) => (
                            <li key={index} className="text-sm text-white">{option}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-text-secondary mb-2">Break Clauses</h5>
                        <ul className="bg-card-dark p-3 rounded-md shadow-lg list-disc pl-5">
                          {selectedDocument.analysis.break_clauses?.map((clause, index) => (
                            <li key={index} className="text-sm text-white">{clause}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-text-secondary mb-2">Red Flags</h5>
                        <ul className="bg-card-dark p-3 rounded-md shadow-lg list-disc pl-5">
                          {selectedDocument.analysis.red_flags?.map((flag, index) => (
                            <li key={index} className="text-sm text-red-400">{flag}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-text-secondary mb-2">Summary</h5>
                        <div className="bg-card-dark p-3 rounded-md shadow-lg">
                          <p className="text-sm text-white">{selectedDocument.analysis.summary}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                      <p className="mt-4 text-sm text-text-secondary">Analyzing lease document...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-white">No document selected</h3>
                  <p className="mt-1 text-sm text-text-secondary">Select a document to view its analysis.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
