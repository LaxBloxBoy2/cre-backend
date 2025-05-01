"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (!data.length) {
    return (
      <div className="p-6 text-center rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
        <p style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottomWidth: '1px', borderBottomColor: 'var(--border-dark)' }}>
            {columns.map((column) => (
              <th
                key={column.key.toString()}
                className={cn(
                  "px-4 py-3 text-left text-sm font-medium",
                  column.className
                )}
                style={{ color: 'var(--text-muted)' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className={cn(
                "transition-colors duration-200",
                onRowClick ? "cursor-pointer" : ""
              )}
              style={{
                borderBottomWidth: '1px',
                borderBottomColor: 'var(--border-dark)'
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={`${index}-${column.key.toString()}`}
                  className={cn(
                    "px-4 py-3 text-sm",
                    column.className
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  {column.render
                    ? column.render(item)
                    : item[column.key as keyof T] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
