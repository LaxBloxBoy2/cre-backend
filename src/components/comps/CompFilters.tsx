'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';

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
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [isOpen, setIsOpen] = useState(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setLocalFilters({ ...localFilters, [name]: value });
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    const resetFilters = {
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
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    setIsOpen(false);
  };

  // Count active filters
  const countActiveFilters = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {countActiveFilters() > 0 && (
                <span className="ml-1 rounded-full bg-accent text-white w-5 h-5 flex items-center justify-center text-xs">
                  {countActiveFilters()}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Market Comps</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down the market comps displayed.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select 
                  value={localFilters.propertyType} 
                  onValueChange={(value) => handleSelectChange('propertyType', value)}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="All Property Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Property Types</SelectItem>
                    <SelectItem value="Multifamily">Multifamily</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Location</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={localFilters.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={localFilters.state}
                    onChange={handleInputChange}
                    placeholder="Enter state (e.g., CA)"
                    maxLength={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipcode">ZIP Code</Label>
                  <Input
                    id="zipcode"
                    name="zipcode"
                    value={localFilters.zipcode}
                    onChange={handleInputChange}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Price Range</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Min Price</Label>
                    <Input
                      id="minPrice"
                      name="minPrice"
                      type="number"
                      value={localFilters.minPrice}
                      onChange={handleInputChange}
                      placeholder="Min"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price</Label>
                    <Input
                      id="maxPrice"
                      name="maxPrice"
                      type="number"
                      value={localFilters.maxPrice}
                      onChange={handleInputChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Rent Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Rent Range</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRent">Min Rent</Label>
                    <Input
                      id="minRent"
                      name="minRent"
                      type="number"
                      value={localFilters.minRent}
                      onChange={handleInputChange}
                      placeholder="Min"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxRent">Max Rent</Label>
                    <Input
                      id="maxRent"
                      name="maxRent"
                      type="number"
                      value={localFilters.maxRent}
                      onChange={handleInputChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Beds & Baths</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBeds">Min Beds</Label>
                    <Input
                      id="minBeds"
                      name="minBeds"
                      type="number"
                      value={localFilters.minBeds}
                      onChange={handleInputChange}
                      placeholder="Min"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxBeds">Max Beds</Label>
                    <Input
                      id="maxBeds"
                      name="maxBeds"
                      type="number"
                      value={localFilters.maxBeds}
                      onChange={handleInputChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBaths">Min Baths</Label>
                    <Input
                      id="minBaths"
                      name="minBaths"
                      type="number"
                      value={localFilters.minBaths}
                      onChange={handleInputChange}
                      placeholder="Min"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxBaths">Max Baths</Label>
                    <Input
                      id="maxBaths"
                      name="maxBaths"
                      type="number"
                      value={localFilters.maxBaths}
                      onChange={handleInputChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Square Footage */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Square Footage</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minSqft">Min Sq Ft</Label>
                    <Input
                      id="minSqft"
                      name="minSqft"
                      type="number"
                      value={localFilters.minSqft}
                      onChange={handleInputChange}
                      placeholder="Min"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxSqft">Max Sq Ft</Label>
                    <Input
                      id="maxSqft"
                      name="maxSqft"
                      type="number"
                      value={localFilters.maxSqft}
                      onChange={handleInputChange}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <SheetFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <Button 
                onClick={handleApplyFilters}
                className="bg-accent text-white hover:bg-accent/90"
              >
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Active Filters */}
        {countActiveFilters() > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.propertyType && (
              <div className="flex items-center bg-accent/10 rounded-full px-3 py-1 text-xs">
                <span>Type: {filters.propertyType}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFilterChange({ ...filters, propertyType: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </div>
            )}
            
            {filters.city && (
              <div className="flex items-center bg-accent/10 rounded-full px-3 py-1 text-xs">
                <span>City: {filters.city}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFilterChange({ ...filters, city: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </div>
            )}
            
            {filters.state && (
              <div className="flex items-center bg-accent/10 rounded-full px-3 py-1 text-xs">
                <span>State: {filters.state}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFilterChange({ ...filters, state: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </div>
            )}
            
            {(filters.minPrice || filters.maxPrice) && (
              <div className="flex items-center bg-accent/10 rounded-full px-3 py-1 text-xs">
                <span>
                  Price: {filters.minPrice ? `$${filters.minPrice}` : '$0'} - 
                  {filters.maxPrice ? `$${filters.maxPrice}` : 'Any'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFilterChange({ ...filters, minPrice: '', maxPrice: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </Button>
              </div>
            )}
            
            {countActiveFilters() > 3 && (
              <div className="flex items-center bg-accent/10 rounded-full px-3 py-1 text-xs">
                <span>+{countActiveFilters() - 3} more</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
