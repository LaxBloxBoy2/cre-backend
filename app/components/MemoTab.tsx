'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface MemoTabProps {
  dealId: string;
  dealData: any;
}

export default function MemoTab({ dealId, dealData }: MemoTabProps) {
  const [memo, setMemo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real app, we would call the API
        // For now, we'll use a conditional to either use the API or mock data
        if (process.env.NODE_ENV === 'production') {
          // Call the real API
          const response = await axios.get(`https://cre-backend-0pvq.onrender.com/api/deals/${dealId}/generate-memo`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          setMemo(response.data.memo);
        } else {
          // Mock response for development
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Generate a mock memo based on the deal data
          const mockMemo = `
# Investment Memo: ${dealData.project_name}

## Executive Summary
${dealData.project_name} is a ${dealData.square_footage.toLocaleString()} SF ${dealData.property_type} property located in ${dealData.location}. The property is being acquired for $${dealData.acquisition_price.toLocaleString()} with an additional $${dealData.construction_cost.toLocaleString()} in planned construction costs.

## Investment Highlights
- Prime ${dealData.property_type} property in ${dealData.location}
- Strong projected rent of $${dealData.projected_rent_per_sf}/SF
- Attractive exit cap rate of ${dealData.exit_cap_rate}%
- Projected 5-year IRR of 12.5%

## Market Overview
${dealData.location} has shown strong growth in the ${dealData.property_type} sector over the past several years. Vacancy rates in the submarket are currently averaging ${dealData.vacancy_rate}%, which is in line with our underwriting assumptions.

## Financial Summary
- Acquisition Price: $${dealData.acquisition_price.toLocaleString()}
- Construction Cost: $${dealData.construction_cost.toLocaleString()}
- Total Project Cost: $${(dealData.acquisition_price + dealData.construction_cost).toLocaleString()}
- Square Footage: ${dealData.square_footage.toLocaleString()} SF
- Projected Rent: $${dealData.projected_rent_per_sf}/SF
- Vacancy Rate: ${dealData.vacancy_rate}%
- Operating Expenses: $${dealData.operating_expenses_per_sf}/SF
- Exit Cap Rate: ${dealData.exit_cap_rate}%

## Investment Strategy
Our strategy for ${dealData.project_name} is to implement a value-add program that will increase rents and decrease vacancy. The planned construction budget of $${dealData.construction_cost.toLocaleString()} will be used to upgrade common areas, improve building systems, and enhance the overall tenant experience.

## Risk Factors
- Market risk: Changes in the ${dealData.property_type} market in ${dealData.location}
- Construction risk: Potential cost overruns or delays
- Leasing risk: Ability to achieve projected rents of $${dealData.projected_rent_per_sf}/SF
- Interest rate risk: Impact on exit cap rates and refinancing options

## Conclusion
${dealData.project_name} represents an attractive investment opportunity with strong projected returns. The combination of a prime location in ${dealData.location}, a well-defined value-add strategy, and favorable market conditions positions this investment for success.
          `;

          setMemo(mockMemo);
        }
      } catch (err) {
        console.error('Error fetching memo:', err);
        setError('Failed to load investment memo. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemo();
  }, [dealId, dealData]);

  if (isLoading) {
    return (
      <div className="shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10 border"
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
          </div>
          <p className="text-center" style={{ color: 'var(--text-muted)' }}>Generating investment memo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10 border"
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10 border"
         style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg leading-6 font-medium" style={{ color: 'var(--text-primary)' }}>Investment Memo</h3>
          <button
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
            onClick={() => {
              // In a real app, this would download the memo as a PDF
              alert('Download functionality would be implemented here');
            }}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>

        <div className="prose max-w-none">
          {memo && (
            <div className="whitespace-pre-line p-6 rounded-lg border"
                 style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-dark)' }}>
              {memo.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>{line.substring(3)}</h2>;
                } else if (line.startsWith('- ')) {
                  return <li key={index} className="ml-6 mb-1" style={{ color: 'var(--text-primary)' }}>{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index} className="mb-3" style={{ color: 'var(--text-primary)' }}>{line}</p>;
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
