'use client';

import React from 'react';

interface InvestmentStrategyCardProps {
  deal: any;
}

export default function InvestmentStrategyCard({ deal }: InvestmentStrategyCardProps) {
  const strategy = deal.strategy || 'VALUE ADD';

  return (
    <div className="shadow-lg rounded-lg overflow-hidden mt-4 transition-all duration-200 hover:shadow-accent-glow/10 border"
         style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b" style={{ borderColor: 'var(--border-dark)' }}>
        <h3 className="text-lg leading-6 font-medium" style={{ color: 'var(--text-primary)' }}>Investment Strategy</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--accent-gradient)', color: 'var(--accent)' }}>
            {strategy}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5" style={{ color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <span className="font-medium" style={{ color: 'var(--accent)' }}>Location:</span> Prime downtown area with strong growth potential
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5" style={{ color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <span className="font-medium" style={{ color: 'var(--accent)' }}>Property Quality:</span> Well-maintained building with opportunity for value-enhancing renovations
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5" style={{ color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <span className="font-medium" style={{ color: 'var(--accent)' }}>Rent Performance:</span> Currently below market with significant upside potential
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
