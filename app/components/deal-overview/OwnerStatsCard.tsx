'use client';

import React, { useMemo } from 'react';
import { calculateMonthsBetween } from '../../lib/utils/date';

interface OwnerStatsCardProps {
  deal: any;
}

export default function OwnerStatsCard({ deal }: OwnerStatsCardProps) {
  // Calculate owner stats
  const { averageHold, currentHold } = useMemo(() => {
    // Default average hold period (industry average)
    let avgHold = 85; // months

    // Calculate current hold period if acquisition_date is available
    let currHold = 0;
    if (deal.acquisition_date) {
      currHold = calculateMonthsBetween(deal.acquisition_date);
    }

    return {
      averageHold: avgHold,
      currentHold: currHold,
    };
  }, [deal])

  return (
    <div className="dark-card shadow-lg rounded-lg overflow-hidden mt-4 transition-all duration-200 hover:shadow-accent-glow/10">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-dark-card-hover">
        <h3 className="text-lg leading-6 font-medium text-white">Owner Stats</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-text-secondary">Average Hold:</span>
              <span className="text-sm text-white">{averageHold || '–'} months</span>
            </div>
            <div className="w-full bg-dark-card-hover rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-[#30E3CA] to-[#11999E] h-2.5 rounded-full"
                style={{ width: averageHold ? `${Math.min(100, (averageHold / 120) * 100)}%` : '0%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-text-secondary">Current Hold:</span>
              <span className="text-sm text-white">{currentHold || '–'} months</span>
            </div>
            <div className="w-full bg-dark-card-hover rounded-full h-2.5">
              <div
                className={`${currentHold > averageHold ? 'bg-green-500' : 'bg-accent'} h-2.5 rounded-full`}
                style={{ width: currentHold ? `${Math.min(100, (currentHold / 120) * 100)}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
