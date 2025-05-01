'use client';

import { useTheme } from 'next-themes';
import { Invoice } from '../types/invoice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { formatCurrency } from '../lib/utils/format';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceList({ invoices, onSelectInvoice }: InvoiceListProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return isDark ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return isDark ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-100 text-red-800 border-red-200';
      default:
        return isDark ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };
  
  return (
    <div className="rounded-lg overflow-hidden border" style={{ 
      borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
    }}>
      <Table>
        <TableHeader>
          <TableRow style={{ 
            backgroundColor: isDark ? 'var(--bg-card-hover-darker)' : 'var(--bg-card-hover-light)'
          }}>
            <TableHead style={{ color: 'var(--text-primary)' }}>Vendor</TableHead>
            <TableHead style={{ color: 'var(--text-primary)' }}>Invoice #</TableHead>
            <TableHead style={{ color: 'var(--text-primary)' }}>Date</TableHead>
            <TableHead className="text-right" style={{ color: 'var(--text-primary)' }}>Amount</TableHead>
            <TableHead style={{ color: 'var(--text-primary)' }}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice.id}
              className="cursor-pointer hover:bg-accent/5"
              onClick={() => onSelectInvoice(invoice)}
              style={{ 
                backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)'
              }}
            >
              <TableCell style={{ color: 'var(--text-primary)' }}>{invoice.vendor_name}</TableCell>
              <TableCell style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</TableCell>
              <TableCell style={{ color: 'var(--text-primary)' }}>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
              <TableCell className="text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.total_amount)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(invoice.status)}>
                  {getStatusIcon(invoice.status)} {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No invoices found. Upload an invoice to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
