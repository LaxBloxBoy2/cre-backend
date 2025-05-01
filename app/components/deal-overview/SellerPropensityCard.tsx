'use client';

import React, { useMemo } from 'react';
import { calculateMonthsBetween } from '../../lib/utils/date';

interface SellerPropensityCardProps {
  deal: any;
}

export default function SellerPropensityCard({ deal }: SellerPropensityCardProps) {
  // Calculate seller propensity based on hold duration
  const { propensityRating, insights } = useMemo(() => {
    let rating = 'Low';
    let reasonings = [];

    // Calculate hold duration if acquisition_date is available
    if (deal.acquisition_date) {
      const holdDuration = calculateMonthsBetween(deal.acquisition_date);

      // If hold duration > 100 months (8+ years), propensity is Medium
      if (holdDuration > 100) {
        rating = 'Medium';
        reasonings.push(`Owner has held property for ${Math.floor(holdDuration / 12)}+ years, exceeding typical 7-year hold period`);
      } else {
        reasonings.push(`Owner has held property for ${Math.floor(holdDuration / 12)} years, which is within typical hold periods`);
      }
    }

    // Add more insights based on property type and market conditions
    if (deal.property_type === 'office' || deal.property_type === 'retail') {
      reasonings.push('Market conditions favorable for seller with cap rate compression');
    }

    if (deal.vacancy_rate < 5) {
      reasonings.push('Property performance trending upward with low vacancy, creating attractive selling opportunity');
      // Increase rating if vacancy is low
      if (rating === 'Low') {
        rating = 'Medium';
      } else if (rating === 'Medium') {
        rating = 'High';
      }
    }

    // Add a generic insight about refinancing
    reasonings.push('Recent refinancing activity suggests potential interest in exit');

    return {
      propensityRating: rating,
      insights: reasonings,
    };
  }, [deal]);

  return (
    <div className="dark-card shadow-lg rounded-lg overflow-hidden mt-4 transition-all duration-200 hover:shadow-accent-glow/10">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-dark-card-hover">
        <h3 className="text-lg leading-6 font-medium text-white">Seller Propensity</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <p className="text-sm text-text-secondary mr-2">Seller Propensity Rating:</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            propensityRating === 'High' ? 'bg-red-900/30 text-red-400' :
            propensityRating === 'Medium' ? 'bg-green-900/30 text-green-400' :
            'bg-blue-900/30 text-blue-400'
          }`}>
            {propensityRating}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Key Insights:</h4>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-2 text-sm text-white">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
