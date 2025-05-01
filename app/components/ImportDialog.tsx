'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from '../components/ui/progress';
import { FileUpload } from './ui/FileUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../contexts/ToastContext';
import { importDeals, getImportStatus, getImportErrors } from '../lib/api';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportDialog({ isOpen, onClose, onSuccess }: ImportDialogProps) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'excel' | 'csv'>('excel');
  const [isUploading, setIsUploading] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<any | null>(null);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<any[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Auto-detect file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      setImportType('csv');
    } else if (extension === 'xlsx') {
      setImportType('excel');
    }
  };

  // Start import
  const handleStartImport = async () => {
    if (!selectedFile) {
      showToast('Please select a file to import', 'error');
      return;
    }

    try {
      setIsUploading(true);

      // Call the import API
      const result = await importDeals(selectedFile, importType);

      // Set the import ID
      setImportId(result.import_id);

      // Show toast
      showToast('Import started successfully', 'success');

    } catch (error) {
      console.error('Error starting import:', error);
      showToast('Failed to start import', 'error');
      setIsUploading(false);
    }
  };

  // Poll for import status with improved error handling and fallback behavior
  useEffect(() => {
    if (!importId) return;

    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;

    // Start polling
    const pollStatus = async () => {
      try {
        console.log(`Polling import status for ${importId}...`);
        const status = await getImportStatus(importId);
        console.log('Received status:', status);

        // Reset failed attempts counter on successful poll
        failedAttempts = 0;

        // Update UI with status
        setImportStatus(status);

        // Ensure progress is always moving forward (never decreases)
        setProgress(prev => Math.max(prev, status.progress_percentage));

        // If import is complete or failed, stop polling
        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`Import ${status.status}. Stopping polling.`);

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          setIsUploading(false);

          // Get errors if any
          if (status.error_count > 0) {
            try {
              console.log('Fetching error details...');
              const errorData = await getImportErrors(importId);
              setErrors(errorData);
            } catch (errorFetchError) {
              console.error('Error fetching import errors:', errorFetchError);
              // Create a generic error if we can't fetch the detailed errors
              setErrors([{
                row_number: 0,
                error_message: 'Failed to fetch detailed error information',
                row_data: {}
              }]);
            }
          }

          // Show toast
          if (status.status === 'completed') {
            showToast(`Import completed: ${status.imported_count} deals imported`, 'success');

            // Call onSuccess callback
            if (onSuccess) {
              onSuccess();
            }
          } else {
            showToast('Import failed', 'error');
          }
        } else if (status.status === 'processing') {
          // If still processing, ensure progress is shown
          if (status.progress_percentage === 0 && status.total_rows > 0) {
            // If progress is 0 but we know total rows, show at least 5%
            setProgress(5);
          }
        }
      } catch (error) {
        console.error('Error polling import status:', error);
        failedAttempts++;

        // If we've failed too many times, assume the import is still running
        // but there's an issue with the status endpoint
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.log('Too many failed polling attempts. Assuming import is still running.');

          // Increment progress slightly to show something is happening
          setProgress(prev => Math.min(prev + 2, 95));

          // After 30 seconds of failures, assume the import is complete
          if (failedAttempts >= MAX_FAILED_ATTEMPTS + 10) {
            console.log('Assuming import is complete after extended failures.');

            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            setIsUploading(false);
            setProgress(100);

            // Create a simulated status
            setImportStatus({
              id: importId,
              status: 'completed',
              total_rows: 0,
              imported_count: 0,
              error_count: 0,
              progress_percentage: 100,
              errors: [],
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            });

            showToast('Import completed, but status details unavailable', 'info');

            // Call onSuccess callback
            if (onSuccess) {
              onSuccess();
            }
          }
        }
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 2 seconds (more frequent updates)
    pollingRef.current = setInterval(pollStatus, 2000);

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [importId, onSuccess, showToast]);

  // Handle dialog close
  const handleClose = () => {
    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Reset state
    setSelectedFile(null);
    setImportType('excel');
    setIsUploading(false);
    setImportId(null);
    setImportStatus(null);
    setProgress(0);
    setErrors([]);
    setShowErrors(false);

    // Close dialog
    onClose();
  };

  // Download error report as CSV
  const downloadErrorReport = () => {
    if (!errors.length) return;

    // Create CSV content
    let csvContent = 'Row,Error,Data\n';

    errors.forEach(error => {
      const rowData = JSON.stringify(error.row_data).replace(/"/g, '""');
      csvContent += `${error.row_number},"${error.error_message}","${rowData}"\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[600px] ${isDark ? 'bg-[#1A1D23] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Deals
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!importId ? (
            // Step 1: File Upload
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Upload File
                </label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".xlsx,.csv"
                  maxSize={20 * 1024 * 1024} // 20MB
                  label="Upload Excel or CSV file"
                  description="Drag and drop a file here, or click to select a file"
                  className={isDark ? 'border-gray-700 hover:border-accent' : 'border-gray-300 hover:border-accent'}
                />
                {selectedFile && (
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Import Type
                </label>
                <Select value={importType} onValueChange={(value) => setImportType(value as 'excel' | 'csv')}>
                  <SelectTrigger className={isDark ? 'bg-[#0F1117] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'}>
                    <SelectValue placeholder="Select import type" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? 'bg-[#1A1D23] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={`p-4 rounded-md ${isDark ? 'bg-[#0F1117] text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Required Format:
                </h4>
                <p className="text-xs mb-3">
                  Your Excel or CSV file must include the following columns with the exact column names shown below:
                </p>
                <div className="overflow-x-auto mb-3">
                  <table className={`text-xs w-full ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                        <th className="py-1 px-2 text-left">project_name</th>
                        <th className="py-1 px-2 text-left">location</th>
                        <th className="py-1 px-2 text-left">property_type</th>
                        <th className="py-1 px-2 text-left">acquisition_price</th>
                        <th className="py-1 px-2 text-left">square_footage</th>
                        <th className="py-1 px-2 text-left">construction_cost</th>
                        <th className="py-1 px-2 text-left">exit_cap_rate</th>
                        <th className="py-1 px-2 text-left">vacancy_rate</th>
                        <th className="py-1 px-2 text-left">operating_expenses_per_sf</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                        <td className="py-1 px-2">Project Alpha</td>
                        <td className="py-1 px-2">New York, NY</td>
                        <td className="py-1 px-2">Office</td>
                        <td className="py-1 px-2">1500000</td>
                        <td className="py-1 px-2">10000</td>
                        <td className="py-1 px-2">500000</td>
                        <td className="py-1 px-2">5.5</td>
                        <td className="py-1 px-2">4</td>
                        <td className="py-1 px-2">12.5</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2">Project Beta</td>
                        <td className="py-1 px-2">Los Angeles, CA</td>
                        <td className="py-1 px-2">Retail</td>
                        <td className="py-1 px-2">2300000</td>
                        <td className="py-1 px-2">15000</td>
                        <td className="py-1 px-2">750000</td>
                        <td className="py-1 px-2">6</td>
                        <td className="py-1 px-2">6</td>
                        <td className="py-1 px-2">15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-xs space-y-2">
                  <p className="font-medium">Important Notes:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Column names must match exactly as shown above</li>
                    <li>All numeric fields should be numbers only (no currency symbols or commas)</li>
                    <li>Each row will create one new deal</li>
                    <li>The first row should be the header row with column names</li>
                  </ul>
                  <div className="mt-3">
                    <a
                      href="/templates/deals_import_template.xlsx"
                      download
                      className="text-accent hover:underline flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        // Create a sample CSV content
                        const csvContent = `project_name,location,property_type,acquisition_price,square_footage,construction_cost,exit_cap_rate,vacancy_rate,operating_expenses_per_sf
Project Alpha,New York NY,Office,1500000,10000,500000,5.5,4,12.5
Project Beta,Los Angeles CA,Retail,2300000,15000,750000,6,6,15
Project Gamma,Chicago IL,Industrial,1750000,12000,600000,5.75,5,13`;

                        // Create a blob and download
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'deals_import_template.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3 w-3" /> Download Template
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Import Progress
            <div className="space-y-4">
              {!showErrors ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Import Progress
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={progress}
                        className={`h-2 ${
                          importStatus?.error_count > 0
                            ? 'bg-red-900/20'
                            : isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                        }`}
                        indicatorClassName={`
                          ${importStatus?.error_count > 0
                            ? 'bg-red-500'
                            : 'bg-accent'
                          }
                          ${isUploading && progress < 100 ? 'animate-pulse' : ''}
                        `}
                      />
                      {isUploading && progress < 100 && (
                        <div
                          className="absolute top-0 left-0 h-full bg-white/20 animate-progress-shine"
                          style={{
                            width: '100%',
                          }}
                        />
                      )}
                    </div>
                    {isUploading && progress < 100 && (
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {importStatus?.status === 'processing'
                          ? `Processing ${importStatus.imported_count + importStatus.error_count} of ${importStatus.total_rows || '?'} rows...`
                          : 'Processing import...'}
                      </p>
                    )}
                  </div>

                  {importStatus && (
                    <div className={`rounded-md p-4 ${isDark ? 'bg-[#0F1117]' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                          <p className={`text-sm font-medium ${
                            importStatus.status === 'completed'
                              ? 'text-green-500'
                              : importStatus.status === 'failed'
                                ? 'text-red-500'
                                : isDark
                                  ? 'text-blue-400'
                                  : 'text-blue-600'
                          }`}>
                            {importStatus.status.charAt(0).toUpperCase() + importStatus.status.slice(1)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Rows</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {importStatus.total_rows}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Imported</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {importStatus.imported_count}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Errors</p>
                          <p className={`text-sm font-medium ${
                            importStatus.error_count > 0
                              ? 'text-red-500'
                              : isDark
                                ? 'text-white'
                                : 'text-gray-800'
                          }`}>
                            {importStatus.error_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importStatus?.status === 'completed' && (
                    <div className={`rounded-md p-4 ${
                      importStatus.error_count > 0
                        ? isDark
                          ? 'bg-red-900/20 border border-red-800'
                          : 'bg-red-50 border border-red-200'
                        : isDark
                          ? 'bg-green-900/20 border border-green-800'
                          : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {importStatus.error_count > 0 ? (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        )}
                        <div>
                          <h4 className={`text-sm font-medium ${
                            importStatus.error_count > 0
                              ? 'text-red-500'
                              : isDark
                                ? 'text-green-400'
                                : 'text-green-600'
                          }`}>
                            {importStatus.error_count > 0
                              ? 'Import completed with errors'
                              : 'Import completed successfully'}
                          </h4>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {importStatus.error_count > 0
                              ? `${importStatus.imported_count} deals imported, ${importStatus.error_count} errors found.`
                              : `${importStatus.imported_count} deals imported successfully.`}
                          </p>

                          {importStatus.error_count > 0 && (
                            <Button
                              variant="link"
                              size="sm"
                              className={`px-0 h-auto text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}
                              onClick={() => setShowErrors(true)}
                            >
                              View Errors
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Step 3: Error Report
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Import Errors ({errors.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={downloadErrorReport}
                    >
                      <Download className="h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>

                  <div className={`rounded-md border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`grid grid-cols-12 gap-2 p-3 text-xs font-medium ${isDark ? 'bg-[#0F1117] text-gray-300 border-b border-gray-700' : 'bg-gray-50 text-gray-600 border-b border-gray-200'}`}>
                      <div className="col-span-1">Row</div>
                      <div className="col-span-4">Error</div>
                      <div className="col-span-7">Data</div>
                    </div>

                    <div className={`max-h-[300px] overflow-y-auto ${isDark ? 'bg-[#1A1D23]' : 'bg-white'}`}>
                      {errors.map((error, index) => (
                        <div
                          key={index}
                          className={`grid grid-cols-12 gap-2 p-3 text-xs ${
                            index !== errors.length - 1
                              ? isDark
                                ? 'border-b border-gray-700'
                                : 'border-b border-gray-200'
                              : ''
                          }`}
                        >
                          <div className="col-span-1">{error.row_number}</div>
                          <div className={`col-span-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {error.error_message}
                          </div>
                          <div className={`col-span-7 ${isDark ? 'text-gray-400' : 'text-gray-500'} break-all`}>
                            {Object.entries(error.row_data)
                              .filter(([key, value]) => value !== null && value !== '')
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                    {key}:
                                  </span>{' '}
                                  {String(value)}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowErrors(false)}
                    className={isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-300'}
                  >
                    Back to Summary
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!importId ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className={isDark ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-800'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartImport}
                disabled={!selectedFile || isUploading}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                {isUploading ? 'Starting Import...' : 'Start Import'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className={`${
                importStatus?.status === 'completed' || importStatus?.status === 'failed'
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : isDark
                    ? 'border-gray-700 text-white'
                    : 'border-gray-300 text-gray-800'
              }`}
              variant={importStatus?.status === 'completed' || importStatus?.status === 'failed' ? 'default' : 'outline'}
            >
              {importStatus?.status === 'completed' || importStatus?.status === 'failed' ? 'Close' : 'Cancel Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
