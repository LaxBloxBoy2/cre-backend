'use client';

// This is a client-side file storage system that uses localStorage
// In a real application, you would use a server-side storage solution

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded file data
  uploadedAt: string;
}

// Store a file in localStorage
export const storeFile = (file: File, documentId: string): Promise<StoredFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target || typeof event.target.result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      
      const storedFile: StoredFile = {
        id: documentId,
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result,
        uploadedAt: new Date().toISOString()
      };
      
      // Get existing files
      const existingFilesJson = localStorage.getItem('stored_files');
      let existingFiles: StoredFile[] = [];
      
      if (existingFilesJson) {
        try {
          existingFiles = JSON.parse(existingFilesJson);
        } catch (error) {
          console.error('Error parsing stored files:', error);
        }
      }
      
      // Check if file with this ID already exists
      const existingIndex = existingFiles.findIndex(f => f.id === documentId);
      
      if (existingIndex >= 0) {
        // Replace existing file
        existingFiles[existingIndex] = storedFile;
      } else {
        // Add new file
        existingFiles.push(storedFile);
      }
      
      // Save back to localStorage
      localStorage.setItem('stored_files', JSON.stringify(existingFiles));
      
      resolve(storedFile);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // Read file as data URL (base64)
    reader.readAsDataURL(file);
  });
};

// Get a file from localStorage
export const getFile = (documentId: string): StoredFile | null => {
  const existingFilesJson = localStorage.getItem('stored_files');
  
  if (!existingFilesJson) {
    return null;
  }
  
  try {
    const existingFiles: StoredFile[] = JSON.parse(existingFilesJson);
    return existingFiles.find(f => f.id === documentId) || null;
  } catch (error) {
    console.error('Error parsing stored files:', error);
    return null;
  }
};

// Get all stored files
export const getAllFiles = (): StoredFile[] => {
  const existingFilesJson = localStorage.getItem('stored_files');
  
  if (!existingFilesJson) {
    return [];
  }
  
  try {
    return JSON.parse(existingFilesJson);
  } catch (error) {
    console.error('Error parsing stored files:', error);
    return [];
  }
};

// Delete a file from localStorage
export const deleteFile = (documentId: string): boolean => {
  const existingFilesJson = localStorage.getItem('stored_files');
  
  if (!existingFilesJson) {
    return false;
  }
  
  try {
    const existingFiles: StoredFile[] = JSON.parse(existingFilesJson);
    const newFiles = existingFiles.filter(f => f.id !== documentId);
    
    if (newFiles.length === existingFiles.length) {
      // No file was removed
      return false;
    }
    
    localStorage.setItem('stored_files', JSON.stringify(newFiles));
    return true;
  } catch (error) {
    console.error('Error parsing stored files:', error);
    return false;
  }
};

// Check if a file exists
export const fileExists = (documentId: string): boolean => {
  return getFile(documentId) !== null;
};

// Get file URL (for display or download)
export const getFileUrl = (documentId: string): string | null => {
  const file = getFile(documentId);
  return file ? file.data : null;
};

// Get file blob (for download)
export const getFileBlob = (documentId: string): Blob | null => {
  const file = getFile(documentId);
  
  if (!file) {
    return null;
  }
  
  try {
    // Convert base64 to blob
    const byteString = atob(file.data.split(',')[1]);
    const mimeString = file.data.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  } catch (error) {
    console.error('Error creating blob from file data:', error);
    return null;
  }
};
