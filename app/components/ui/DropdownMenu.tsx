"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onSelect: (value: string) => void;
  trigger: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({
  items,
  onSelect,
  trigger,
  className,
  align = 'left',
  width = 'w-48',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            "absolute z-10 mt-2 rounded-md shadow-lg bg-card-dark border border-dark-card-hover",
            width,
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div className="py-1 rounded-md bg-card-dark shadow-xs">
            {items.map((item) => (
              <button
                key={item.value}
                onClick={() => !item.disabled && handleSelect(item.value)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                  item.disabled 
                    ? "text-text-secondary cursor-not-allowed" 
                    : "text-white hover:bg-dark-card-hover transition-colors duration-200"
                )}
                disabled={item.disabled}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
