'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { MapView } from '@/components/comps/MapView';
import { TableView } from '@/components/comps/TableView';
import { ViewToggle } from '@/components/comps/ViewToggle';
import { CompFilters } from '@/components/comps/CompFilters';
import { useComps } from '@/hooks/useComps';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

export default function CompsPage() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [view, setView] = useState<'map' | 'table'>('map');
  const [center, setCenter] = useState({ lat: 32.7, lng: -117.2 }); // Default to San Diego
  const [filters, setFilters] = useState({
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

  // Fetch comps data
  const { comps, isLoading, error, refetch } = useComps({
    lat: center.lat,
    lng: center.lng,
    radius: 10, // 10 miles radius
    propertyType: filters.propertyType || undefined,
    city: filters.city || undefined,
    state: filters.state || undefined,
    zipcode: filters.zipcode || undefined,
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Handle view toggle
  const handleViewToggle = (newView: 'map' | 'table') => {
    setView(newView);
  };

  // Handle center change (from map)
  const handleCenterChange = (newCenter: { lat: number; lng: number }) => {
    setCenter(newCenter);
  };

  // Handle adding comp to underwriting
  const handleAddToUnderwriting = (compId: string) => {
    toast({
      title: 'Added to Underwriting',
      description: `Comp ${compId} has been added to your underwriting`,
      variant: 'success',
    });
  };

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error Loading Comps',
        description: 'There was an error loading the market comps. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Market Comps</h1>
          <ViewToggle currentView={view} onViewToggle={handleViewToggle} />
        </div>

        <CompFilters filters={filters} onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[500px] w-full rounded-lg" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-10 w-1/4" />
            </div>
          </div>
        ) : (
          <>
            {view === 'map' ? (
              <MapView 
                comps={comps || []} 
                center={center} 
                onCenterChange={handleCenterChange} 
                onAddToUnderwriting={handleAddToUnderwriting}
              />
            ) : (
              <TableView 
                comps={comps || []} 
                onAddToUnderwriting={handleAddToUnderwriting} 
              />
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="bg-accent text-white hover:bg-accent/90"
          >
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
