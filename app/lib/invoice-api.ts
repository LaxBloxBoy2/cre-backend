'use client';

import { Invoice, LineItem } from '../types/invoice';
import api from './api';
import { extractInvoiceFromPdf } from './utils/pdf-extractor';

// Upload and parse invoice
export const uploadInvoice = async (dealId: string, file: File) => {
  // Check if we're using demo token - if so, simulate success
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - simulating invoice upload and parsing');

      // Simulate a delay for OCR processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Show a message about extracting text
      console.log('Extracting text from PDF...');

      // Extract invoice data from PDF
      const extractedData = await extractInvoiceFromPdf(file);

      // Create the invoice object with guaranteed line items
      const invoice: Invoice = {
        id: `invoice-${Date.now()}`,
        deal_id: dealId,
        vendor_name: extractedData.vendor_name || 'Unknown Vendor',
        invoice_number: extractedData.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
        invoice_date: extractedData.invoice_date || new Date().toISOString().split('T')[0],
        total_amount: extractedData.total_amount || 0,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        line_items: extractedData.line_items || [],
        original_pdf_url: URL.createObjectURL(file)
      };

      // Ensure we have line items and a valid total amount
      if (invoice.line_items.length === 0) {
        // This shouldn't happen with our new approach, but just in case
        console.warn('No line items extracted, adding defaults');

        invoice.line_items = [
          {
            description: 'Professional Services',
            quantity: 10,
            unit_price: 125,
            total: 1250
          },
          {
            description: 'Project Management',
            quantity: 5,
            unit_price: 200,
            total: 1000
          },
          {
            description: 'Research & Development',
            quantity: 1,
            unit_price: 1500,
            total: 1500
          }
        ];

        // Recalculate total amount
        invoice.total_amount = invoice.line_items.reduce((sum, item) => sum + item.total, 0);
      }

      console.log(`Created invoice with ${invoice.line_items.length} line items:`,
        invoice.line_items.map(item => `${item.description}: ${item.quantity} x ${item.unit_price} = ${item.total}`));

      // Log the extracted data
      console.log('Extracted invoice data:', {
        vendor: invoice.vendor_name,
        invoice_number: invoice.invoice_number,
        date: invoice.invoice_date,
        total: invoice.total_amount,
        line_items: invoice.line_items.length
      });

      // Store in localStorage for demo persistence
      try {
        // Create a clean copy of the invoice for storage
        const invoiceToStore = {
          id: invoice.id,
          deal_id: invoice.deal_id,
          vendor_name: invoice.vendor_name,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          total_amount: invoice.total_amount,
          status: invoice.status,
          uploaded_at: invoice.uploaded_at,
          line_items: invoice.line_items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          })),
          original_pdf_url: '/mock-invoice.pdf' // Use a static URL for storage
        };

        // Get existing invoices
        const storedInvoices = localStorage.getItem('demoInvoices');
        let invoices = storedInvoices ? JSON.parse(storedInvoices) : [];

        // Remove any existing invoice with the same ID (shouldn't happen, but just in case)
        invoices = invoices.filter((inv: Invoice) => inv.id !== invoice.id);

        // Add the new invoice at the beginning of the array
        invoices = [invoiceToStore, ...invoices];

        // Store in localStorage
        localStorage.setItem('demoInvoices', JSON.stringify(invoices));

        console.log('Stored invoice in localStorage. Total invoices:', invoices.length);
        console.log('Invoice line items count:', invoiceToStore.line_items.length);
        console.log('Line items stored:', invoiceToStore.line_items);

        // Verify storage
        const verifyStorage = localStorage.getItem('demoInvoices');
        if (verifyStorage) {
          const parsedInvoices = JSON.parse(verifyStorage);
          if (parsedInvoices.length > 0) {
            console.log('Verified storage - first invoice line items:',
              parsedInvoices[0].line_items.length,
              parsedInvoices[0].line_items);
          }
        }
      } catch (e) {
        console.error('Error storing invoice in localStorage:', e);
      }

      return invoice;
    }
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);

    // Call the API
    const response = await api.post('/api/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading invoice:', error);
    throw error;
  }
};

// Get invoices for a deal
export const getInvoices = async (dealId: string) => {
  // Check if we're using demo token - if so, return demo data
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - returning demo invoices');

      // Check if we have stored invoices in localStorage
      const storedInvoices = localStorage.getItem('demoInvoices');
      if (storedInvoices) {
        try {
          const invoices = JSON.parse(storedInvoices);
          console.log(`Found ${invoices.length} invoices in localStorage`);

          // Filter invoices for this deal
          const dealInvoices = invoices.filter((inv: Invoice) => inv.deal_id === dealId);
          console.log(`Found ${dealInvoices.length} invoices for deal ${dealId}`);

          if (dealInvoices.length > 0) {
            return dealInvoices;
          }
        } catch (e) {
          console.error('Error parsing stored invoices:', e);
        }
      } else {
        console.log('No invoices found in localStorage');
      }

      // If no stored invoices or error, return default mock invoices with multiple line items
      const defaultInvoices = [
        {
          id: 'invoice-1',
          deal_id: dealId,
          vendor_name: 'Acme Corporation',
          invoice_number: 'INV-2023-001',
          invoice_date: '2023-08-15',
          total_amount: 7350,
          status: 'pending',
          uploaded_at: '2023-08-16T10:30:00Z',
          line_items: [
            {
              description: 'Consulting Services',
              quantity: 10,
              unit_price: 150,
              total: 1500
            },
            {
              description: 'Market Research',
              quantity: 1,
              unit_price: 2500,
              total: 2500
            },
            {
              description: 'Financial Analysis',
              quantity: 1,
              unit_price: 1800,
              total: 1800
            },
            {
              description: 'Strategy Development',
              quantity: 4,
              unit_price: 200,
              total: 800
            },
            {
              description: 'Documentation',
              quantity: 1,
              unit_price: 750,
              total: 750
            }
          ],
          original_pdf_url: '/mock-invoice.pdf'
        },
        {
          id: 'invoice-2',
          deal_id: dealId,
          vendor_name: 'XYZ Suppliers',
          invoice_number: 'XYZ-5678',
          invoice_date: '2023-08-10',
          total_amount: 5650,
          status: 'approved',
          uploaded_at: '2023-08-11T14:45:00Z',
          line_items: [
            {
              description: 'Office Furniture',
              quantity: 5,
              unit_price: 500,
              total: 2500
            },
            {
              description: 'Installation',
              quantity: 1,
              unit_price: 1000,
              total: 1000
            },
            {
              description: 'Office Equipment',
              quantity: 3,
              unit_price: 450,
              total: 1350
            },
            {
              description: 'Delivery Fee',
              quantity: 1,
              unit_price: 800,
              total: 800
            }
          ],
          original_pdf_url: '/mock-invoice-2.pdf'
        }
      ];

      // Store default invoices in localStorage for future use
      try {
        // Check if we already have invoices in localStorage
        const existingInvoices = localStorage.getItem('demoInvoices');
        if (!existingInvoices) {
          // Only store default invoices if we don't have any
          localStorage.setItem('demoInvoices', JSON.stringify(defaultInvoices));
          console.log('Stored default invoices in localStorage');
        } else {
          console.log('Using existing invoices from localStorage');
        }
      } catch (e) {
        console.error('Error storing default invoices:', e);
      }

      return defaultInvoices;
    }
  }

  try {
    const response = await api.get(`/api/deals/${dealId}/invoices`);
    return response.data;
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
};

// Get invoice by ID
export const getInvoice = async (invoiceId: string) => {
  // Check if we're using demo token - if so, return demo data
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - returning demo invoice');

      // Return mock invoice
      return {
        id: invoiceId,
        deal_id: 'deal1',
        vendor_name: 'Acme Corporation',
        invoice_number: 'INV-2023-001',
        invoice_date: '2023-08-15',
        total_amount: 1250.75,
        status: 'pending',
        uploaded_at: '2023-08-16T10:30:00Z',
        line_items: [
          {
            description: 'Consulting Services',
            quantity: 10,
            unit_price: 100,
            total: 1000
          },
          {
            description: 'Administrative Fee',
            quantity: 1,
            unit_price: 250.75,
            total: 250.75
          }
        ],
        original_pdf_url: '/mock-invoice.pdf'
      };
    }
  }

  try {
    const response = await api.get(`/api/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invoice:', error);
    throw error;
  }
};

// Approve invoice
export const approveInvoice = async (invoiceId: string) => {
  // Check if we're using demo token - if so, simulate success
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - simulating invoice approval');

      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the current invoice data first
      let currentInvoice;
      try {
        // Try to find the invoice in localStorage
        const storedInvoices = localStorage.getItem('demoInvoices');
        if (storedInvoices) {
          const invoices = JSON.parse(storedInvoices);
          currentInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
        }

        // If not found in localStorage, create a basic one
        if (!currentInvoice) {
          currentInvoice = {
            id: invoiceId,
            deal_id: 'demo1',
            vendor_name: 'Demo Vendor',
            invoice_number: 'DEMO-123',
            invoice_date: '2023-08-15',
            total_amount: 1000,
            status: 'pending',
            uploaded_at: new Date().toISOString(),
            line_items: [],
            original_pdf_url: '/mock-invoice.pdf'
          };
        }
      } catch (e) {
        console.error('Error getting current invoice:', e);
        // Fallback to basic invoice
        currentInvoice = {
          id: invoiceId,
          status: 'pending'
        };
      }

      // Return complete invoice with updated status
      return {
        ...currentInvoice,
        status: 'approved',
      };
    }
  }

  try {
    const response = await api.post(`/api/invoices/${invoiceId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving invoice:', error);
    throw error;
  }
};

// Reject invoice
export const rejectInvoice = async (invoiceId: string) => {
  // Check if we're using demo token - if so, simulate success
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - simulating invoice rejection');

      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the current invoice data first
      let currentInvoice;
      try {
        // Try to find the invoice in localStorage
        const storedInvoices = localStorage.getItem('demoInvoices');
        if (storedInvoices) {
          const invoices = JSON.parse(storedInvoices);
          currentInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
        }

        // If not found in localStorage, create a basic one
        if (!currentInvoice) {
          currentInvoice = {
            id: invoiceId,
            deal_id: 'demo1',
            vendor_name: 'Demo Vendor',
            invoice_number: 'DEMO-123',
            invoice_date: '2023-08-15',
            total_amount: 1000,
            status: 'pending',
            uploaded_at: new Date().toISOString(),
            line_items: [],
            original_pdf_url: '/mock-invoice.pdf'
          };
        }
      } catch (e) {
        console.error('Error getting current invoice:', e);
        // Fallback to basic invoice
        currentInvoice = {
          id: invoiceId,
          status: 'pending'
        };
      }

      // Return complete invoice with updated status
      return {
        ...currentInvoice,
        status: 'rejected',
      };
    }
  }

  try {
    const response = await api.post(`/api/invoices/${invoiceId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting invoice:', error);
    throw error;
  }
};

// Update invoice
export const updateInvoice = async (invoiceId: string, updatedData: Partial<Invoice>) => {
  // Check if we're using demo token - if so, simulate success
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - simulating invoice update');

      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the current invoice data first
      let currentInvoice;
      try {
        // Try to find the invoice in localStorage
        const storedInvoices = localStorage.getItem('demoInvoices');
        if (storedInvoices) {
          const invoices = JSON.parse(storedInvoices);
          currentInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);

          if (currentInvoice) {
            // Update the invoice
            const updatedInvoice = {
              ...currentInvoice,
              ...updatedData,
            };

            // Recalculate total amount if line items were updated
            if (updatedData.line_items) {
              updatedInvoice.total_amount = updatedData.line_items.reduce(
                (sum, item) => sum + item.total,
                0
              );
            }

            // Update the invoice in localStorage
            const updatedInvoices = invoices.map((inv: Invoice) =>
              inv.id === invoiceId ? updatedInvoice : inv
            );

            localStorage.setItem('demoInvoices', JSON.stringify(updatedInvoices));

            return updatedInvoice;
          }
        }

        throw new Error('Invoice not found');
      } catch (e) {
        console.error('Error updating invoice:', e);
        throw e;
      }
    }
  }

  try {
    const response = await api.put(`/api/invoices/${invoiceId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Download invoice as Excel
export const downloadInvoiceExcel = async (invoiceId: string) => {
  // Check if we're using demo token - if so, simulate download
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - simulating Excel download');

      // Create a mock Excel file (this is just a placeholder)
      const mockData = 'Mock Excel Data';
      const blob = new Blob([mockData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    }
  }

  try {
    // Use fetch for binary data
    const response = await fetch(`${api.defaults.baseURL}/api/invoices/${invoiceId}/excel`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error downloading Excel: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading invoice Excel:', error);
    throw error;
  }
};
