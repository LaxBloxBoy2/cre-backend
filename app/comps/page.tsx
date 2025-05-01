'use client';

import { useState, useEffect } from 'react';
import { MapView } from '../components/comps/MapView';
import { TableView } from '../components/comps/TableView';
import { ViewToggle } from '../components/comps/ViewToggle';
import { CompFilters } from '../components/comps/CompFilters';
import { useComps } from '../hooks/useComps';
import { Button } from '../components/ui/button';

export default function CompsPage() {
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
    alert(`Added comp ${compId} to underwriting`);
  };

  // Handle error
  useEffect(() => {
    if (error) {
      alert('Error loading comps: ' + error.message);
    }
  }, [error]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Market Comps</h1>
          <ViewToggle currentView={view} onViewToggle={handleViewToggle} />
        </div>

        <CompFilters filters={filters} onFilterChange={handleFilterChange} />

        {isLoading ? (
          <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-[#1e1e1e] shadow-sm">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4 mx-auto border-accent"></div>
              <p className="text-gray-800 dark:text-white">Loading market comps...</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'map' ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <MapView
                  comps={comps || []}
                  center={center}
                  onCenterChange={handleCenterChange}
                  onAddToUnderwriting={handleAddToUnderwriting}
                />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-[#1e1e1e]">
                <TableView
                  comps={comps || []}
                  onAddToUnderwriting={handleAddToUnderwriting}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => refetch()}
            className="bg-accent text-white hover:bg-accent/90 shadow-sm"
          >
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
