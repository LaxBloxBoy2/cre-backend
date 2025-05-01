'use client';

import React, { useState } from 'react';
import { ExternalLink, Edit, Star } from 'lucide-react';
import PropertyAttributesDialog from './PropertyAttributesDialog';

interface PropertyAttributesProps {
  deal: any;
}

export default function PropertyAttributes({ deal: initialDeal }: PropertyAttributesProps) {
  const [deal, setDeal] = useState(initialDeal);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDealUpdated = (updatedDeal: any) => {
    setDeal(updatedDeal);
    // If there's a parent component that needs to be notified of the update
    if (initialDeal.onUpdate) {
      initialDeal.onUpdate(updatedDeal);
    }
  };

  const openPropertyWebsite = () => {
    // This would typically open the property website in a new tab
    // For now, we'll just search for the property on Google
    const searchQuery = encodeURIComponent(`${deal.project_name} ${deal.location}`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const openPropertyReviews = () => {
    // This would typically open property reviews
    // For now, we'll just search for reviews on Google
    const searchQuery = encodeURIComponent(`${deal.project_name} ${deal.location} reviews`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  // Format property type for display
  const formatPropertyType = (type: string) => {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  return (
    <>
      <div className="shadow-lg rounded-lg overflow-hidden h-full transition-all duration-200 hover:shadow-accent-glow/10 border"
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b" style={{ borderColor: 'var(--border-dark)' }}>
          <h3 className="text-lg leading-6 font-medium" style={{ color: 'var(--text-primary)' }}>Property Attributes</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={openPropertyWebsite}
              className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-dark)'
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Website
            </button>
            <button
              type="button"
              onClick={openPropertyReviews}
              className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-dark)'
              }}
            >
              <Star className="h-3.5 w-3.5 mr-1" />
              Reviews
            </button>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-dark)'
              }}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </button>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Property Name</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.project_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Address</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.location}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Property Type</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                {formatPropertyType(deal.property_type)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Property Class</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.property_class || 'Class A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Property Style</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.property_style || 'Modern'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Property Subtype</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.property_subtype || 'High-rise'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Year Built</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.year_built || '2005'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Units</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.units || '120'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Square Footage</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.square_footage?.toLocaleString() || '0'} SF</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Lot Size</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.lot_size || '2.5 acres'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Zoning</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.zoning || 'Commercial'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Parking Spaces</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.parking_spaces || '150'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Occupancy</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{100 - (deal.vacancy_rate || 0)}%</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Acquisition Date</dt>
              <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{deal.acquisition_date || 'Jan 15, 2023'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <PropertyAttributesDialog
        deal={deal}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDealUpdated={handleDealUpdated}
      />
    </>
  );
}
