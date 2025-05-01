'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { MarketComp } from '@/types/marketComp';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils/format';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';

interface TableViewProps {
  comps: MarketComp[];
  onAddToUnderwriting: (compId: string) => void;
}

type SortField = 'price' | 'rent' | 'sqft' | 'beds' | 'baths' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function TableView({ comps, onAddToUnderwriting }: TableViewProps) {
  const { theme } = useTheme();
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort comps
  const sortedComps = [...comps].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null values
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    // Sort based on direction
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });

  // Handle checkbox change
  const handleCheckboxChange = (compId: string) => {
    if (selectedComps.includes(compId)) {
      setSelectedComps(selectedComps.filter(id => id !== compId));
    } else {
      setSelectedComps([...selectedComps, compId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedComps.length === comps.length) {
      setSelectedComps([]);
    } else {
      setSelectedComps(comps.map(comp => comp.id));
    }
  };

  // Handle add selected to underwriting
  const handleAddSelectedToUnderwriting = () => {
    selectedComps.forEach(compId => {
      onAddToUnderwriting(compId);
    });
    setSelectedComps([]);
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {selectedComps.length > 0 && (
        <div className="flex justify-between items-center p-2 bg-accent/10 rounded-lg">
          <span className="text-sm font-medium">
            {selectedComps.length} {selectedComps.length === 1 ? 'comp' : 'comps'} selected
          </span>
          <Button 
            size="sm"
            className="bg-accent text-white hover:bg-accent/90"
            onClick={handleAddSelectedToUnderwriting}
          >
            Add Selected to Underwriting
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedComps.length === comps.length && comps.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Property Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Price
                  {renderSortIcon('price')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('rent')}
              >
                <div className="flex items-center">
                  Rent
                  {renderSortIcon('rent')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('beds')}
              >
                <div className="flex items-center">
                  Beds
                  {renderSortIcon('beds')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('baths')}
              >
                <div className="flex items-center">
                  Baths
                  {renderSortIcon('baths')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('sqft')}
              >
                <div className="flex items-center">
                  Sq Ft
                  {renderSortIcon('sqft')}
                </div>
              </TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedComps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No market comps found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedComps.map(comp => (
                <TableRow key={comp.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedComps.includes(comp.id)}
                      onCheckedChange={() => handleCheckboxChange(comp.id)}
                      aria-label={`Select ${comp.property_type}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{comp.property_type}</TableCell>
                  <TableCell>{comp.city}, {comp.state} {comp.zipcode}</TableCell>
                  <TableCell>{comp.price ? formatCurrency(comp.price) : '-'}</TableCell>
                  <TableCell>{comp.rent ? formatCurrency(comp.rent) : '-'}</TableCell>
                  <TableCell>{comp.beds || '-'}</TableCell>
                  <TableCell>{comp.baths || '-'}</TableCell>
                  <TableCell>{comp.sqft ? comp.sqft.toLocaleString() : '-'}</TableCell>
                  <TableCell>{comp.source}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAddToUnderwriting(comp.id)}>
                          Add to Underwriting
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`https://maps.google.com/?q=${comp.latitude},${comp.longitude}`, '_blank')}>
                          View on Google Maps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
