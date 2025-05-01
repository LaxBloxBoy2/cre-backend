"use client";

import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  label = 'Upload a file',
  description = 'Drag and drop a file here, or click to select a file',
  error,
  disabled = false,
  multiple = false,
}: FileUploadProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      setFileError(`File size exceeds the maximum limit of ${formatFileSize(maxSize)}`);
      return false;
    }

    // Check file type if accept is specified
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;

      // Handle file extensions (e.g., .pdf, .docx)
      const fileExtension = '.' + file.name.split('.').pop();

      if (!acceptedTypes.some(type =>
        type === fileType ||
        type === fileExtension ||
        (type.includes('/*') && fileType.startsWith(type.split('/')[0]))
      )) {
        setFileError(`File type not accepted. Please upload ${accept}`);
        return false;
      }
    }

    setFileError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</label>}

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? isDark
              ? "border-accent bg-gray-800/50"
              : "border-accent bg-gray-100/50"
            : isDark
              ? "border-gray-700"
              : "border-gray-300",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isDark
              ? "hover:border-accent hover:bg-gray-800/30"
              : "hover:border-accent hover:bg-gray-100/30",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled}
          multiple={multiple}
        />

        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>

          {selectedFile ? (
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(selectedFile.size)}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {accept !== '*/*' ? `Accepted formats: ${accept}` : ''}
                {accept !== '*/*' && maxSize ? ' • ' : ''}
                {maxSize ? `Max size: ${formatFileSize(maxSize)}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {(error || fileError) && (
        <p className="mt-1 text-sm text-red-400">{error || fileError}</p>
      )}
    </div>
  );
}
