'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Invoice } from '../types/invoice';
import { InvoiceUploader } from './InvoiceUploader';
import { InvoiceList } from './InvoiceList';
import { InvoiceTable } from './InvoiceTable';
import { getInvoices } from '../lib/invoice-api';
import { useToast } from '../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

interface InvoicesTabProps {
  dealId: string;
}

export function InvoicesTab({ dealId }: InvoicesTabProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load invoices on mount
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await getInvoices(dealId);
        setInvoices(data);
      } catch (error) {
        console.error('Error loading invoices:', error);
        showToast("Failed to load invoices", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [dealId, showToast]);

  const handleUploadComplete = async (invoice: Invoice) => {
    // Add the new invoice to the list
    setInvoices(prev => [invoice, ...prev]);
    // Select the new invoice
    setSelectedInvoice(invoice);

    // Refresh the invoice list to ensure we have the latest data
    try {
      const refreshedInvoices = await getInvoices(dealId);
      setInvoices(refreshedInvoices);

      // Make sure the selected invoice is still selected
      const refreshedInvoice = refreshedInvoices.find(inv => inv.id === invoice.id);
      if (refreshedInvoice) {
        setSelectedInvoice(refreshedInvoice);
      }
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    }
  };

  const handleStatusChange = (updatedInvoice: Invoice) => {
    // Update the invoice in the list
    setInvoices(prev => prev.map(inv =>
      inv.id === updatedInvoice.id ? { ...inv, status: updatedInvoice.status } : inv
    ));

    // Update the selected invoice
    setSelectedInvoice(prev => prev && prev.id === updatedInvoice.id ? { ...prev, status: updatedInvoice.status } : prev);

    // Update localStorage for demo persistence
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token === 'demo_access_token') {
        try {
          const storedInvoices = localStorage.getItem('demoInvoices');
          if (storedInvoices) {
            const invoices = JSON.parse(storedInvoices);
            const updatedInvoices = invoices.map((inv: Invoice) =>
              inv.id === updatedInvoice.id ? { ...inv, status: updatedInvoice.status } : inv
            );
            localStorage.setItem('demoInvoices', JSON.stringify(updatedInvoices));
          }
        } catch (e) {
          console.error('Error updating invoice status in localStorage:', e);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Invoice Section - Full Width */}
      <div className="w-full">
        <InvoiceUploader dealId={dealId} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Selected Invoice Details - Full Width */}
      <div className="w-full">
        {selectedInvoice ? (
          <InvoiceTable
            invoice={selectedInvoice}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex items-center justify-center p-12 rounded-lg" style={{
            backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
            borderWidth: '1px',
            borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
          }}>
            <div className="text-center">
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No Invoice Selected
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Upload a new invoice or select an existing one from the list below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invoice List Section - Full Width */}
      <div className="w-full">
        <div className="space-y-2">
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            All Invoices
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center p-8" style={{
              backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
              borderWidth: '1px',
              borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
              borderRadius: '0.5rem'
            }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <InvoiceList
              invoices={invoices}
              onSelectInvoice={setSelectedInvoice}
            />
          )}
        </div>
      </div>
    </div>
  );
}
