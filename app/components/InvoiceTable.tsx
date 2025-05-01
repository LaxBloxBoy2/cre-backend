'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Invoice, LineItem } from '../types/invoice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../lib/utils/format';
import { Check, X, Download, FileSpreadsheet, Edit, Save, Plus, Trash2 } from 'lucide-react';
import { approveInvoice, rejectInvoice, downloadInvoiceExcel, updateInvoice } from '../lib/invoice-api';
import { useToast } from '../contexts/ToastContext';
import { Input } from './ui/input';

interface InvoiceTableProps {
  invoice: Invoice;
  onStatusChange: (invoice: Invoice) => void;
}

export function InvoiceTable({ invoice, onStatusChange }: InvoiceTableProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Invoice>({ ...invoice });
  const [editedLineItems, setEditedLineItems] = useState<LineItem[]>([...invoice.line_items]);

  // Update the edited invoice when the original invoice changes
  useEffect(() => {
    if (!isEditing) {
      setEditedInvoice({ ...invoice });
      setEditedLineItems([...invoice.line_items]);
    }
  }, [invoice, isEditing]);

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

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const updatedInvoice = await approveInvoice(invoice.id);
      showToast("Invoice has been approved successfully", "success");
      onStatusChange({ ...invoice, status: 'approved' });
    } catch (error) {
      console.error('Error approving invoice:', error);
      showToast("Failed to approve invoice", "error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const updatedInvoice = await rejectInvoice(invoice.id);
      showToast("Invoice has been rejected", "warning");
      onStatusChange({ ...invoice, status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      showToast("Failed to reject invoice", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoiceExcel(invoice.id);
      showToast("Invoice data has been downloaded as Excel", "success");
    } catch (error) {
      console.error('Error downloading Excel:', error);
      showToast("Failed to download Excel file", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // Start editing
  const handleStartEditing = () => {
    setIsEditing(true);
    setEditedInvoice({ ...invoice });
    setEditedLineItems([...invoice.line_items]);
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedInvoice({ ...invoice });
    setEditedLineItems([...invoice.line_items]);
  };

  // Update invoice header field
  const handleInvoiceFieldChange = (field: keyof Invoice, value: string | number) => {
    setEditedInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update line item field
  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newLineItems = [...editedLineItems];

    // Convert value to number for numeric fields
    if (field === 'quantity' || field === 'unit_price') {
      const numValue = parseFloat(value as string);
      newLineItems[index][field] = isNaN(numValue) ? 0 : numValue;

      // Recalculate total for this line item
      newLineItems[index].total = newLineItems[index].quantity * newLineItems[index].unit_price;
    } else {
      newLineItems[index][field] = value;
    }

    setEditedLineItems(newLineItems);
  };

  // Add new line item
  const handleAddLineItem = () => {
    const newLineItem: LineItem = {
      description: 'New Item',
      quantity: 1,
      unit_price: 0,
      total: 0
    };

    setEditedLineItems([...editedLineItems, newLineItem]);
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    const newLineItems = [...editedLineItems];
    newLineItems.splice(index, 1);
    setEditedLineItems(newLineItems);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Calculate total amount
      const totalAmount = editedLineItems.reduce((sum, item) => sum + item.total, 0);

      // Prepare updated invoice data
      const updatedData: Partial<Invoice> = {
        ...editedInvoice,
        line_items: editedLineItems,
        total_amount: totalAmount
      };

      // Call API to update invoice
      const updatedInvoice = await updateInvoice(invoice.id, updatedData);

      // Show success message
      showToast("Invoice updated successfully", "success");

      // Update parent component
      onStatusChange(updatedInvoice);

      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      showToast("Failed to update invoice", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="rounded-lg p-4" style={{
        backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)',
        borderWidth: '1px',
        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
      }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    Vendor Name
                  </label>
                  <Input
                    value={editedInvoice.vendor_name}
                    onChange={(e) => handleInvoiceFieldChange('vendor_name', e.target.value)}
                    className="w-full"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                      color: 'var(--text-primary)',
                      borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Invoice Number
                    </label>
                    <Input
                      value={editedInvoice.invoice_number}
                      onChange={(e) => handleInvoiceFieldChange('invoice_number', e.target.value)}
                      className="w-full"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                        color: 'var(--text-primary)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Invoice Date
                    </label>
                    <Input
                      type="date"
                      value={editedInvoice.invoice_date}
                      onChange={(e) => handleInvoiceFieldChange('invoice_date', e.target.value)}
                      className="w-full"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                        color: 'var(--text-primary)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  {invoice.vendor_name}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Invoice #: <span style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</span>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Date: <span style={{ color: 'var(--text-primary)' }}>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Total: <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.total_amount)}</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status === 'pending' && '⏳ Pending'}
              {invoice.status === 'approved' && '✅ Approved'}
              {invoice.status === 'rejected' && '❌ Rejected'}
            </Badge>

            {!isEditing && invoice.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
                className={isDark ? 'border-gray-700 hover:border-accent' : 'border-gray-300 hover:border-accent'}
              >
                <span className="flex items-center">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </span>
              </Button>
            )}

            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={isDownloading}
                className={isDark ? 'border-gray-700 hover:border-accent' : 'border-gray-300 hover:border-accent'}
              >
                {isDownloading ? (
                  <span className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-1 animate-pulse" />
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </span>
                )}
              </Button>
            )}

            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditing}
                  className={isDark ? 'border-gray-700 hover:border-red-700' : 'border-gray-300 hover:border-red-300'}
                >
                  <span className="flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-accent hover:bg-accent/90 text-white border-transparent"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-1 animate-pulse" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-lg overflow-hidden border" style={{
        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
      }}>
        <Table>
          <TableHeader>
            <TableRow style={{
              backgroundColor: isDark ? 'var(--bg-card-hover-darker)' : 'var(--bg-card-hover-light)'
            }}>
              <TableHead style={{ color: 'var(--text-primary)' }}>Description</TableHead>
              <TableHead className="text-right" style={{ color: 'var(--text-primary)' }}>Quantity</TableHead>
              <TableHead className="text-right" style={{ color: 'var(--text-primary)' }}>Unit Price</TableHead>
              <TableHead className="text-right" style={{ color: 'var(--text-primary)' }}>Total</TableHead>
              {isEditing && (
                <TableHead className="w-10" style={{ color: 'var(--text-primary)' }}></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isEditing ? editedLineItems : invoice.line_items).map((item: LineItem, index: number) => (
              <TableRow key={index} style={{
                backgroundColor: isDark
                  ? index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-hover)'
                  : index % 2 === 0 ? 'var(--bg-card-light)' : 'var(--bg-card-hover-light)'
              }}>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className="w-full"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                        color: 'var(--text-primary)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)'
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      className="w-20 ml-auto"
                      min="0"
                      step="1"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                        color: 'var(--text-primary)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                        textAlign: 'right'
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                      className="w-24 ml-auto"
                      min="0"
                      step="0.01"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-input)' : '#F9FAFB',
                        color: 'var(--text-primary)',
                        borderColor: isDark ? 'var(--border-dark)' : 'var(--border-light)',
                        textAlign: 'right'
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.unit_price)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.total)}
                </TableCell>
                {isEditing && (
                  <TableCell className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLineItem(index)}
                      className="h-8 w-8 p-0"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" style={{ color: isDark ? '#F87171' : '#EF4444' }} />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {isEditing && (
              <TableRow style={{
                backgroundColor: isDark ? 'var(--bg-card)' : 'var(--bg-card-light)'
              }}>
                <TableCell colSpan={isEditing ? 5 : 4}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="text-xs"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line Item
                  </Button>
                </TableCell>
              </TableRow>
            )}

            <TableRow style={{
              backgroundColor: isDark ? 'var(--bg-card-hover-darker)' : 'var(--bg-card-hover-light)',
              fontWeight: 'bold'
            }}>
              <TableCell colSpan={isEditing ? 3 : 3} className="text-right" style={{ color: 'var(--text-primary)' }}>Total</TableCell>
              <TableCell className="text-right" style={{ color: 'var(--text-primary)' }}>
                {isEditing
                  ? formatCurrency(editedLineItems.reduce((sum, item) => sum + item.total, 0))
                  : formatCurrency(invoice.total_amount)
                }
              </TableCell>
              {isEditing && <TableCell></TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Action Buttons */}
      {invoice.status === 'pending' && !isEditing && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isRejecting || isApproving}
            className={isDark ? 'border-gray-700 hover:border-red-700 hover:text-red-500' : 'border-gray-300 hover:border-red-300 hover:text-red-600'}
          >
            {isRejecting ? (
              <span className="flex items-center">
                <X className="h-4 w-4 mr-1 animate-pulse" />
                Rejecting...
              </span>
            ) : (
              <span className="flex items-center">
                <X className="h-4 w-4 mr-1" />
                Reject
              </span>
            )}
          </Button>

          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="bg-accent hover:bg-accent/90 text-white transition-all duration-200 hover:shadow-accent-glow"
          >
            {isApproving ? (
              <span className="flex items-center">
                <Check className="h-4 w-4 mr-1 animate-pulse" />
                Approving...
              </span>
            ) : (
              <span className="flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Approve
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
