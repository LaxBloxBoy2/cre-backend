'use client';

import React from 'react';
import { AuditTrailEntry } from '../../types/underwriting';
import { formatDate } from '../../lib/utils/date';
import { formatCurrency, formatPercentage } from '../../lib/utils/format';

interface AuditTrailProps {
  entries: AuditTrailEntry[];
}

export default function AuditTrail({ entries }: AuditTrailProps) {
  // Helper function to format values based on their type and field name
  const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';

    if (typeof value === 'number') {
      if (field.includes('rate') || field.includes('irr') || field.includes('return')) {
        return formatPercentage(value * 100);
      } else if (field.includes('price') || field.includes('value') || field.includes('amount') || field.includes('cost')) {
        return formatCurrency(value);
      } else if (field.includes('multiple')) {
        return value.toFixed(2) + 'x';
      } else {
        return value.toFixed(2);
      }
    }

    return String(value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Audit Trail</h3>

      {entries.length === 0 ? (
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-card-hover)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-muted)'
        }}>
          No changes have been recorded yet.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)'
        }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Timestamp</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Field</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Old Value</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--text-muted)' }}>New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-dark)' }}>
              {entries.map((entry, index) => (
                <tr key={index} className="hover:bg-opacity-50" style={{
                  ':hover': { backgroundColor: 'var(--bg-card-hover)' }
                }}>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(entry.timestamp, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {entry.user_name}
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {entry.field_changed.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatValue(entry.field_changed, entry.old_value)}
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatValue(entry.field_changed, entry.new_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
