'use client';

import { useState } from 'react';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useMetricExplanation } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';

interface MetricExplainerProps {
  metric: string;
  value: number | string;
  dealId?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export default function MetricExplainer({ metric, value, dealId = 'global', placement = 'bottom' }: MetricExplainerProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useMetricExplanation(dealId, metric);

  // Fallback explanations if API fails
  const getFallbackExplanation = () => {
    switch(metric.toLowerCase()) {
      case 'irr':
        return `Internal Rate of Return (IRR) is the annualized rate of return an investment is expected to generate. An IRR of ${value}% is considered ${Number(value) > 15 ? 'excellent' : Number(value) > 12 ? 'good' : 'moderate'} for this type of investment.`;
      case 'cap_rate':
        return 'Capitalization Rate (Cap Rate) is the ratio between the net operating income (NOI) of a property and its current market value. It represents the potential return on investment and is used to estimate the investor\'s potential return on a real estate investment.';
      case 'equity_multiple':
        return `Equity Multiple shows how much the initial investment is expected to grow. A ${value}x multiple means each dollar invested is projected to return $${value} (including the original dollar).`;
      case 'dscr':
        return 'Debt Service Coverage Ratio (DSCR) is a measure of a property\'s cash flow relative to its debt obligations. A DSCR greater than 1 indicates that the property generates sufficient income to cover its debt payments.';
      case 'development_margin':
        return 'Development Margin is the profit margin on a real estate development project, calculated as the difference between the project\'s exit value and its total cost, expressed as a percentage of the total cost.';
      case 'investment_period':
        return `The Investment Period is the expected duration of the investment. A ${value} year hold period is ${Number(value) <= 5 ? 'relatively short-term' : Number(value) >= 10 ? 'long-term' : 'medium-term'} for commercial real estate.`;
      case 'occupancy':
        return `Occupancy rate of ${value}% indicates the percentage of the property that is leased to tenants. This is ${Number(value) > 95 ? 'excellent' : Number(value) > 90 ? 'good' : Number(value) > 85 ? 'average' : 'below average'} for this property type.`;
      default:
        return `${metric.replace('_', ' ')} of ${value} is an important metric for evaluating this investment opportunity.`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="ml-1 text-text-secondary hover:text-accent focus:outline-none">
          <InfoCircledIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-dark-card border-dark-border" side={placement}>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <div className="text-error text-sm">Error loading explanation</div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-medium text-white">{data?.metric || metric.replace('_', ' ').toUpperCase()}</h4>
            <p className="text-sm text-text-secondary">{data?.explanation || getFallbackExplanation()}</p>
            {data?.comparison && (
              <p className="text-xs text-text-secondary mt-1">{data.comparison}</p>
            )}
            <div className="pt-2 border-t border-dark-border">
              <p className="text-xs text-text-secondary">
                Current value: <span className="text-white font-medium">{data?.value || value}</span>
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
