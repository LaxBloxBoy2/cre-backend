'use client';

import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface InputValidationProps {
  id: string;
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  type?: 'text' | 'number' | 'percentage' | 'currency';
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function InputValidation({
  id,
  label,
  value,
  onChange,
  type = 'number',
  min,
  max,
  step = 0.01,
  tooltip,
  error,
  className = '',
  disabled = false,
  placeholder = ''
}: InputValidationProps) {
  // Convert value for display
  const displayValue = () => {
    if (value === undefined || value === null || value === '') return '';
    
    if (type === 'percentage' && typeof value === 'number') {
      return (value * 100).toString();
    }
    
    return value.toString();
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (newValue === '') {
      onChange(0);
      return;
    }
    
    let parsedValue = parseFloat(newValue);
    
    if (isNaN(parsedValue)) {
      return;
    }
    
    // Convert percentage input to decimal
    if (type === 'percentage') {
      parsedValue = parsedValue / 100;
    }
    
    // Apply min/max constraints
    if (min !== undefined && parsedValue < min) {
      parsedValue = min;
    }
    
    if (max !== undefined && parsedValue > max) {
      parsedValue = max;
    }
    
    onChange(parsedValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-white">
          {label}
        </Label>
        
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="h-4 w-4 text-text-secondary hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-dark-card border-dark-border text-white max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={displayValue()}
          onChange={handleChange}
          step={step}
          min={type === 'percentage' && min !== undefined ? min * 100 : min}
          max={type === 'percentage' && max !== undefined ? max * 100 : max}
          className={`${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${
            type === 'currency' ? 'pl-6' : ''
          }`}
          disabled={disabled}
          placeholder={placeholder}
        />
        
        {type === 'currency' && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            $
          </span>
        )}
        
        {type === 'percentage' && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            %
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
