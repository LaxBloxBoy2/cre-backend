'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../contexts/ToastContext';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

// Define the expected columns for deal import
const EXPECTED_COLUMNS = [
  'project_name',
  'location',
  'property_type',
  'acquisition_price',
  'square_footage',
  'construction_cost'
];

// Define the property types for validation
const PROPERTY_TYPES = ['Office', 'Retail', 'Industrial', 'Multifamily', 'Hotel', 'Mixed-Use', 'Land'];

// Define the template data for download
const TEMPLATE_DATA = [
  EXPECTED_COLUMNS,
  ['Project Alpha', 'New York, NY', 'Office', '1500000', '10000', '500000'],
  ['Project Beta', 'Los Angeles, CA', 'Retail', '2300000', '15000', '750000']
];

interface ImportRow {
  project_name: string;
  location: string;
  property_type: string;
  acquisition_price: number;
  square_footage: number;
  construction_cost: number;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  dealId?: string;
}

export default function BulkImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [importType, setImportType] = useState<string>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      setValidationErrors([]);
      setParsedData([]);
      setImportResults([]);
      setIsComplete(false);
      setShowPreview(false);
      parseFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  // Parse the uploaded file
  const parseFile = (file: File) => {
    setIsUploading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setProgress(40);
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        setProgress(60);

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setProgress(80);

        // Validate the data
        const { validData, errors } = validateData(jsonData);
        setParsedData(validData);
        setValidationErrors(errors);

        setProgress(100);
        setIsUploading(false);

        if (errors.length === 0 && validData.length > 0) {
          setShowPreview(true);
          showToast('File parsed successfully. Please review the data before importing.', 'success');
        } else if (errors.length > 0) {
          showToast(`File parsed with ${errors.length} validation errors. Please fix them before importing.`, 'warning');
        } else {
          showToast('No valid data found in the file. Please check the file format.', 'error');
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        setIsUploading(false);
        setProgress(0);
        showToast('Error parsing file. Please check the file format.', 'error');
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setProgress(0);
      showToast('Error reading file. Please try again.', 'error');
    };

    reader.readAsBinaryString(file);
  };

  // Validate the imported data
  const validateData = (data: any[]): { validData: ImportRow[], errors: ValidationError[] } => {
    const validData: ImportRow[] = [];
    const errors: ValidationError[] = [];

    // Check if the data has the expected columns
    if (data.length === 0) {
      errors.push({
        row: 0,
        column: 'all',
        message: 'The file is empty or has no valid data.'
      });
      return { validData, errors };
    }

    // Check the first row for column headers
    const firstRow = data[0];
    const missingColumns = EXPECTED_COLUMNS.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      errors.push({
        row: 0,
        column: missingColumns.join(', '),
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 1; // 1-based for user display
      const validatedRow: ImportRow = {
        project_name: '',
        location: '',
        property_type: '',
        acquisition_price: 0,
        square_footage: 0,
        construction_cost: 0
      };

      let isRowValid = true;

      // Validate project_name
      if (!row.project_name || typeof row.project_name !== 'string' || row.project_name.trim() === '') {
        errors.push({
          row: rowNumber,
          column: 'project_name',
          message: 'Project name is required and must be a non-empty string.'
        });
        isRowValid = false;
      } else {
        validatedRow.project_name = row.project_name.trim();
      }

      // Validate location
      if (!row.location || typeof row.location !== 'string' || row.location.trim() === '') {
        errors.push({
          row: rowNumber,
          column: 'location',
          message: 'Location is required and must be a non-empty string.'
        });
        isRowValid = false;
      } else {
        validatedRow.location = row.location.trim();
      }

      // Validate property_type
      if (!row.property_type || typeof row.property_type !== 'string' || !PROPERTY_TYPES.includes(row.property_type.trim())) {
        errors.push({
          row: rowNumber,
          column: 'property_type',
          message: `Property type must be one of: ${PROPERTY_TYPES.join(', ')}`
        });
        isRowValid = false;
      } else {
        validatedRow.property_type = row.property_type.trim();
      }

      // Validate acquisition_price
      const acquisitionPrice = parseFloat(row.acquisition_price);
      if (isNaN(acquisitionPrice) || acquisitionPrice <= 0) {
        errors.push({
          row: rowNumber,
          column: 'acquisition_price',
          message: 'Acquisition price must be a positive number.'
        });
        isRowValid = false;
      } else {
        validatedRow.acquisition_price = acquisitionPrice;
      }

      // Validate square_footage
      const squareFootage = parseFloat(row.square_footage);
      if (isNaN(squareFootage) || squareFootage <= 0) {
        errors.push({
          row: rowNumber,
          column: 'square_footage',
          message: 'Square footage must be a positive number.'
        });
        isRowValid = false;
      } else {
        validatedRow.square_footage = squareFootage;
      }

      // Validate construction_cost
      const constructionCost = parseFloat(row.construction_cost);
      if (isNaN(constructionCost) || constructionCost < 0) {
        errors.push({
          row: rowNumber,
          column: 'construction_cost',
          message: 'Construction cost must be a non-negative number.'
        });
        isRowValid = false;
      } else {
        validatedRow.construction_cost = constructionCost;
      }

      if (isRowValid) {
        validData.push(validatedRow);
      }
    });

    return { validData, errors };
  };

  // Process the import
  const processImport = async () => {
    if (parsedData.length === 0) {
      showToast('No valid data to import.', 'error');
      return;
    }

    setIsProcessing(true);
    setImportResults([]);

    const results: ImportResult[] = [];
    let processedCount = 0;

    for (const row of parsedData) {
      try {
        // Simulate API call to create a deal
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate a random ID for demo purposes
        const dealId = Math.random().toString(36).substring(2, 10);

        results.push({
          success: true,
          message: `Deal "${row.project_name}" created successfully.`,
          dealId
        });
      } catch (error) {
        console.error('Error creating deal:', error);
        results.push({
          success: false,
          message: `Failed to create deal "${row.project_name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      processedCount++;
      setProgress(Math.floor((processedCount / parsedData.length) * 100));
    }

    setImportResults(results);
    setIsProcessing(false);
    setIsComplete(true);

    const successCount = results.filter(r => r.success).length;
    showToast(`Import complete. ${successCount} of ${results.length} deals created successfully.`,
      successCount === results.length ? 'success' : successCount > 0 ? 'warning' : 'error');
  };

  // Download template
  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(TEMPLATE_DATA);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deals');

    XLSX.writeFile(workbook, 'deal_import_template.xlsx');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Bulk Import Deals</h1>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--text-primary)' }}>Upload File</CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Upload Excel or CSV file with deal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}>
                    <SelectValue placeholder="Select import type" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-accent bg-accent bg-opacity-5' : 'border-gray-600'
                }`}
                style={{
                  borderColor: isDragActive ? 'var(--accent)' : 'var(--border-dark)',
                  backgroundColor: isDragActive ? 'var(--accent-light)' : 'var(--bg-card-hover)'
                }}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Drag and drop a file here, or click to select a file
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  Accepted formats: .xlsx, .csv • Max size: 20 MB
                </p>
                {file && (
                  <div className="mt-4 p-2 rounded" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="mt-4">
                  <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {progress < 100 ? 'Processing file...' : 'File processed!'}
                  </p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                style={{ borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>

              {showPreview && (
                <Button
                  onClick={processImport}
                  disabled={isProcessing || validationErrors.length > 0}
                  style={{
                    background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                    color: 'white'
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Import Deals'}
                </Button>
              )}
            </CardFooter>
          </Card>

          {validationErrors.length > 0 && (
            <Alert className="mt-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Please fix the following errors before importing:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>...and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <Card className="mt-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--text-primary)' }}>Processing Import</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-4" />
                <p style={{ color: 'var(--text-muted)' }}>
                  Processing {parsedData.length} deals... Please wait.
                </p>
              </CardContent>
            </Card>
          )}

          {isComplete && (
            <Card className="mt-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--text-primary)' }}>Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {importResults.filter(r => r.success).length} Successful
                    </span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 mr-2 text-red-500" />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {importResults.filter(r => !r.success).length} Failed
                    </span>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderBottom: '1px solid var(--border-dark)' }}>
                        <TableHead style={{ color: 'var(--text-muted)' }}>Status</TableHead>
                        <TableHead style={{ color: 'var(--text-muted)' }}>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResults.map((result, index) => (
                        <TableRow key={index} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                          <TableCell>
                            <Badge variant={result.success ? 'default' : 'destructive'}>
                              {result.success ? 'Success' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ color: 'var(--text-primary)' }}>{result.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => router.push('/deals')}
                  style={{
                    background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                    color: 'white'
                  }}
                >
                  View Deals
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Data Preview */}
          {showPreview && parsedData.length > 0 && (
            <Card className="mt-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--text-primary)' }}>Data Preview</CardTitle>
                <CardDescription style={{ color: 'var(--text-muted)' }}>
                  {parsedData.length} deals ready to import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderBottom: '1px solid var(--border-dark)' }}>
                        <TableHead style={{ color: 'var(--text-muted)' }}>Project Name</TableHead>
                        <TableHead style={{ color: 'var(--text-muted)' }}>Property Type</TableHead>
                        <TableHead style={{ color: 'var(--text-muted)' }}>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, index) => (
                        <TableRow key={index} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                          <TableCell style={{ color: 'var(--text-primary)' }}>{row.project_name}</TableCell>
                          <TableCell style={{ color: 'var(--text-primary)' }}>{row.property_type}</TableCell>
                          <TableCell style={{ color: 'var(--text-primary)' }}>
                            ${row.acquisition_price.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsedData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center" style={{ color: 'var(--text-muted)' }}>
                            ...and {parsedData.length - 5} more deals
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Format - Moved to bottom */}
          <Card className="mt-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--text-primary)' }}>Required Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
                Your Excel or CSV file must include the following columns with the exact column names shown below:
              </p>

              <div className="overflow-x-auto mb-4" style={{ backgroundColor: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      {EXPECTED_COLUMNS.map(col => (
                        <TableHead key={col} style={{ color: 'var(--text-muted)' }}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <TableCell style={{ color: 'var(--text-primary)' }}>Project Alpha</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>New York, NY</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>Office</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>1500000</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>10000</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>500000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ color: 'var(--text-primary)' }}>Project Beta</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>Los Angeles, CA</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>Retail</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>2300000</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>15000</TableCell>
                      <TableCell style={{ color: 'var(--text-primary)' }}>750000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Important Notes:</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1" style={{ color: 'var(--text-muted)' }}>
                      <li>Column names must match exactly as shown above</li>
                      <li>All numeric fields should be numbers only (no currency symbols or commas)</li>
                      <li>Each row will create one new deal</li>
                      <li>The first row should be the header row with column names</li>
                    </ul>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                  style={{ borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
