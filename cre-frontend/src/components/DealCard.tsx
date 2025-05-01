'use client';

import { Deal } from '@/types/deal';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  className?: string;
}

export function DealCard({ deal, className }: DealCardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/deals/${deal.id}`}>
      <div className={cn('border rounded-lg p-6 hover:shadow-md transition-shadow', className)}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{deal.project_name}</h3>
          <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(deal.status))}>
            {deal.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          <p>{deal.location}</p>
          <p>{deal.property_type}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Acquisition Price</p>
            <p className="text-sm font-medium">{formatCurrency(deal.acquisition_price)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Construction Cost</p>
            <p className="text-sm font-medium">{formatCurrency(deal.construction_cost)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Square Footage</p>
            <p className="text-sm font-medium">{deal.square_footage.toLocaleString()} SF</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rent per SF</p>
            <p className="text-sm font-medium">${deal.projected_rent_per_sf.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <p className="text-xs text-gray-500">IRR</p>
            <p className="text-sm font-medium">{deal.irr ? formatPercent(deal.irr) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">DSCR</p>
            <p className="text-sm font-medium">{deal.dscr ? deal.dscr.toFixed(2) : 'N/A'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
