'use client';

import { useState } from 'react';
import { Deal } from '@/types/deal';

interface MemoViewerProps {
  deal: Deal;
  className?: string;
}

export function MemoViewer({ deal, className }: MemoViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [memo, setMemo] = useState<string | null>(null);

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

  const handleGenerateMemo = async () => {
    setIsGenerating(true);
    
    try {
      // In a real app, this would call an API endpoint
      // For now, we'll just simulate a delay and generate a simple memo
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const generatedMemo = `
# Investment Memo: ${deal.project_name}

## Executive Summary
${deal.project_name} is a ${deal.property_type} property located in ${deal.location}. The property is being acquired for ${formatCurrency(deal.acquisition_price)} with an additional ${formatCurrency(deal.construction_cost)} in construction costs.

## Property Details
- **Location**: ${deal.location}
- **Property Type**: ${deal.property_type}
- **Square Footage**: ${deal.square_footage.toLocaleString()} SF
- **Projected Rent**: $${deal.projected_rent_per_sf.toFixed(2)}/SF
- **Vacancy Rate**: ${formatPercent(deal.vacancy_rate)}
- **Operating Expenses**: $${deal.operating_expenses_per_sf.toFixed(2)}/SF

## Financial Metrics
- **Acquisition Price**: ${formatCurrency(deal.acquisition_price)}
- **Construction Cost**: ${formatCurrency(deal.construction_cost)}
- **Total Project Cost**: ${formatCurrency(deal.acquisition_price + deal.construction_cost)}
- **Exit Cap Rate**: ${formatPercent(deal.exit_cap_rate)}
- **IRR**: ${deal.irr ? formatPercent(deal.irr) : 'N/A'}
- **DSCR**: ${deal.dscr ? deal.dscr.toFixed(2) : 'N/A'}

## Investment Thesis
This investment represents an opportunity to acquire a well-located ${deal.property_type} property in ${deal.location}. The business plan involves value-add renovations to increase rents and improve the overall quality of the property.

## Risk Factors
- Market competition
- Construction cost overruns
- Lease-up risk
- Interest rate fluctuations

## Conclusion
Based on the projected returns and the strength of the local market, we recommend proceeding with this investment opportunity.
      `;
      
      setMemo(generatedMemo);
    } catch (error) {
      console.error('Error generating memo:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">Investment Memo</h3>
        {!memo && (
          <button
            onClick={handleGenerateMemo}
            disabled={isGenerating}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Memo'}
          </button>
        )}
      </div>
      
      <div className="p-4">
        {memo ? (
          <div className="prose prose-sm max-w-none">
            {memo.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold mt-0">{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-semibold mt-4">{line.substring(3)}</h2>;
              } else if (line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.substring(2)}</li>;
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else {
                return <p key={index} className="my-2">{line}</p>;
              }
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
            <p>{isGenerating ? 'Generating memo...' : 'Click "Generate Memo" to create an investment memo for this deal'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
