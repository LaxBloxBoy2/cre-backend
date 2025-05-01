'use client';

import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CompFiltersProps {
  filters: {
    propertyType: string;
    city: string;
    state: string;
    zipcode: string;
    minPrice: string;
    maxPrice: string;
    minRent: string;
    maxRent: string;
    minBeds: string;
    maxBeds: string;
    minBaths: string;
    maxBaths: string;
    minSqft: string;
    maxSqft: string;
  };
  onFilterChange: (filters: any) => void;
}

export function CompFilters({ filters, onFilterChange }: CompFiltersProps) {
  // Clear all filters
  const clearFilters = () => {
    onFilterChange({
      propertyType: '',
      city: '',
      state: '',
      zipcode: '',
      minPrice: '',
      maxPrice: '',
      minRent: '',
      maxRent: '',
      minBeds: '',
      maxBeds: '',
      minBaths: '',
      maxBaths: '',
      minSqft: '',
      maxSqft: '',
    });
  };

  return (
    <div className="border border-border rounded-md p-4 mb-4 shadow-sm bg-[#f7f7f7] dark:bg-[#1e1e1e]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">City</label>
          <Input
            placeholder="City"
            value={filters.city}
            onChange={(e) => onFilterChange({ city: e.target.value })}
            className="bg-white dark:bg-[#111] text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-white">State</label>
          <Input
            placeholder="State"
            value={filters.state}
            onChange={(e) => onFilterChange({ state: e.target.value })}
            className="bg-white dark:bg-[#111] text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
