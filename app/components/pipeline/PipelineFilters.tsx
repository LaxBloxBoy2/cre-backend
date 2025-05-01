'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { CrossIcon } from '../icons';

// Import Slider with error handling
let Slider: any;
try {
  Slider = require('../ui/slider').Slider;
} catch (error) {
  console.warn('Slider component not available:', error);
  // Fallback to a simple range input
  Slider = ({ value, onValueChange, min, max, step }: any) => (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value), value[1]])}
      className="w-full"
      style={{ accentColor: 'var(--accent)' }}
    />
  );
}

interface PipelineFiltersProps {
  onClose: () => void;
  onFilter?: (filters: PipelineFilterOptions) => void;
}

export interface PipelineFilterOptions {
  propertyType: string;
  capRateRange: [number, number];
  stage?: string;
}

export function PipelineFilters({ onClose, onFilter }: PipelineFiltersProps) {
  const [propertyType, setPropertyType] = useState<string>('all');
  const [capRateRange, setCapRateRange] = useState<[number, number]>([3, 8]);

  const handleReset = () => {
    setPropertyType('all');
    setCapRateRange([3, 8]);

    if (onFilter) {
      onFilter({
        propertyType: 'all',
        capRateRange: [3, 8]
      });
    }
  };

  const handleApplyFilters = () => {
    if (onFilter) {
      onFilter({
        propertyType,
        capRateRange
      });
    }
    onClose();
  };

  return (
    <Card
      className="mb-4 animate-slideInFromTop"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)'
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filter Deals</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
          >
            <CrossIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label
              htmlFor="property-type"
              className="mb-1 block"
              style={{ color: 'var(--text-muted)' }}
            >
              Property Type
            </Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger
                id="property-type"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              >
                <SelectValue placeholder="All Property Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Property Types</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="multifamily">Multifamily</SelectItem>
                <SelectItem value="mixed_use">Mixed Use</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              className="mb-1 block"
              style={{ color: 'var(--text-muted)' }}
            >
              Cap Rate Range: {capRateRange[0]}% - {capRateRange[1]}%
            </Label>
            {Slider ? (
              <Slider
                min={1}
                max={12}
                step={0.5}
                value={capRateRange}
                onValueChange={(value: [number, number]) => setCapRateRange(value)}
                className="mt-6"
              />
            ) : (
              <div className="flex items-center space-x-4 mt-6">
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={capRateRange[0]}
                  onChange={(e) => setCapRateRange([Number(e.target.value), capRateRange[1]])}
                  className="w-full"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={capRateRange[1]}
                  onChange={(e) => setCapRateRange([capRateRange[0], Number(e.target.value)])}
                  className="w-full"
                  style={{ accentColor: 'var(--accent)' }}
                />
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="mr-2"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-dark)'
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              style={{
                background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                color: 'white'
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
