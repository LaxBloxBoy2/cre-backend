"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function SearchInput({
  onSearch,
  className,
  placeholder = "Search...",
  icon,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Add keyboard shortcut (/) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not already in an input/textarea
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onSearch) {
      onSearch(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={cn(
      "relative flex items-center",
      className
    )}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
        {icon || (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-accent focus:border-accent transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-card-hover)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)',
          '&::placeholder': { color: 'var(--text-muted)' }
        }}
        placeholder={`${placeholder} (Press / to focus)`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
          style={{
            color: 'var(--text-muted)',
            '&:hover': { color: 'var(--text-primary)' }
          }}
          onClick={() => {
            setValue('');
            if (onSearch) {
              onSearch('');
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
