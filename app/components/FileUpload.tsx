'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../contexts/ToastContext';
import { uploadDocument } from '../lib/api';
import { storeFile } from '../lib/fileStorage';
import { v4 as uuidv4 } from 'uuid';

interface FileUploadProps {
  dealId?: string;
  onSuccess?: () => void;
}

export default function FileUpload({ dealId, onSuccess }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    if (!category) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      setIsUploading(true);

      // Show uploading toast
      showToast('Uploading document...', 'info');

      // Generate a unique ID for the document
      const documentId = uuidv4();

      // Store the actual file in localStorage
      await storeFile(selectedFile, documentId);

      // Create form data for the API
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', category);
      formData.append('description', description);

      if (dealId) {
        formData.append('dealId', dealId);
      }

      // Get existing demo documents
      let demoDocuments = [];
      const existingDocs = localStorage.getItem('demo_documents');

      if (existingDocs) {
        try {
          demoDocuments = JSON.parse(existingDocs);
        } catch (error) {
          console.error('Error parsing demo documents:', error);
        }
      }

      // Create a new document entry
      const newDocument = {
        id: documentId,
        name: selectedFile.name,
        type: selectedFile.type.includes('pdf') ? 'PDF' :
              selectedFile.type.includes('excel') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') ? 'Excel' :
              selectedFile.type.includes('word') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') ? 'Word' :
              'Document',
        size: selectedFile.size,
        category: category,
        description: description,
        deal_id: dealId || '1',
        deal_name: 'Office Tower A',
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'Current User'
      };

      // Add the new document to the demo documents
      demoDocuments.push(newDocument);

      // Save the updated demo documents
      localStorage.setItem('demo_documents', JSON.stringify(demoDocuments));

      // Show success message
      showToast('Document uploaded successfully', 'success');

      // Reset form
      setSelectedFile(null);
      setCategory('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Close dialog
      setIsOpen(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        console.log('Calling onSuccess callback to refresh document list');
        onSuccess();
      }

      // Force multiple refreshes to ensure the document list is updated
      const refreshIntervals = [500, 1500, 3000];
      refreshIntervals.forEach(delay => {
        setTimeout(() => {
          console.log(`Forcing document list refresh after ${delay}ms`);
          if (onSuccess) {
            onSuccess();
          }
        }, delay);
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast('Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
          color: 'white',
          boxShadow: 'var(--shadow-neon)'
        }}
      >
        Upload Document
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file" style={{ color: 'var(--text-primary)' }}>Select File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
              />
              {selectedFile && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" style={{ color: 'var(--text-primary)' }}>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="due_diligence">Due Diligence</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" style={{ color: 'var(--text-primary)' }}>Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              style={{
                borderColor: 'var(--border-dark)',
                color: 'var(--text-primary)'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              style={{
                background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                color: 'white',
                boxShadow: 'var(--shadow-neon)'
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
