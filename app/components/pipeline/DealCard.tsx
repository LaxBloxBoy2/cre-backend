'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '../../lib/utils';
import { Deal } from '../../types/deal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

interface DealCardProps {
  deal: Deal;
  isDraggable?: boolean;
}

export function DealCard({ deal, isDraggable = true }: DealCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Get property type icon
  const propertyTypeIcon = getPropertyTypeIcon(deal.property_type);

  // Format cap rate
  const capRate = deal.exit_cap_rate ? `${deal.exit_cap_rate.toFixed(2)}%` : 'N/A';

  // Calculate days in current stage (placeholder for now)
  const daysInStage = 5; // This would be calculated based on stage change date

  const handleClick = () => {
    router.push(`/deals/${deal.id}`);
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md touch-none select-none ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        boxShadow: isHovered ? 'var(--pipeline-card-hover-shadow)' : 'var(--pipeline-card-shadow)',
        touchAction: 'none', // Improves touch device dragging
        userSelect: 'none' // Prevent text selection during drag
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isDraggable ? undefined : handleClick} // Only navigate on click if not draggable
      data-draggable={isDraggable ? 'true' : 'false'}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="text-xl mr-2" aria-hidden="true">{propertyTypeIcon}</span>
            <h3
              className="font-medium text-sm truncate max-w-[180px]"
              style={{ color: 'var(--text-primary)' }}
            >
              {deal.project_name}
            </h3>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    backgroundColor: getBadgeColor(deal.status),
                    color: 'var(--text-primary)'
                  }}
                >
                  {formatStatus(deal.status)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Deal Status: {formatStatus(deal.status)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          {deal.location}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Cap Rate: {capRate}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(deal.acquisition_price)}
            </div>
          </div>

          {daysInStage > 0 && (
            <div
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)'
              }}
            >
              {daysInStage}d
            </div>
          )}
        </div>

        {isHovered && (
          <div
            className="mt-2 pt-2 text-xs animate-fadeIn"
            style={{
              borderTop: '1px solid var(--border-dark)',
              color: 'var(--text-muted)'
            }}
          >
            {deal.irr && (
              <div className="flex justify-between">
                <span>IRR:</span>
                <span style={{ color: 'var(--text-primary)' }}>{deal.irr.toFixed(1)}%</span>
              </div>
            )}
            {deal.dscr && (
              <div className="flex justify-between">
                <span>DSCR:</span>
                <span style={{ color: 'var(--text-primary)' }}>{deal.dscr.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getPropertyTypeIcon(propertyType: string): string {
  switch (propertyType.toLowerCase()) {
    case 'office':
      return '🏢';
    case 'retail':
      return '🏬';
    case 'industrial':
      return '🏭';
    case 'multifamily':
      return '🏘️';
    case 'mixed_use':
    case 'mixed use':
      return '🏙️';
    case 'land':
      return '🏞️';
    case 'hospitality':
      return '🏨';
    default:
      return '🏗️';
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

function getBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'var(--bg-card-hover-darker)';
    case 'in_review':
    case 'in review':
      return 'rgba(245, 158, 11, 0.2)';
    case 'approved':
      return 'rgba(16, 185, 129, 0.2)';
    case 'rejected':
      return 'rgba(239, 68, 68, 0.2)';
    case 'archived':
      return 'rgba(107, 114, 128, 0.2)';
    default:
      return 'var(--bg-card-hover-darker)';
  }
}
