'use client';

import React from 'react';
import { ScenarioComparison as ScenarioComparisonType } from '../../types/underwriting';
import { formatCurrency, formatPercentage } from '../../lib/utils/format';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from '@radix-ui/react-icons';

interface ScenarioComparisonProps {
  comparison: ScenarioComparisonType;
  baseScenarioName: string;
  compareScenarioName: string;
}

export default function ScenarioComparison({
  comparison,
  baseScenarioName,
  compareScenarioName
}: ScenarioComparisonProps) {
  // Helper function to format values based on their type
  const formatValue = (key: string, value: any) => {
    if (typeof value === 'number') {
      if (key.includes('rate') || key.includes('irr') || key.includes('return')) {
        return formatPercentage(value * 100);
      } else if (key.includes('price') || key.includes('value') || key.includes('amount') || key.includes('cost')) {
        return formatCurrency(value);
      } else if (key.includes('multiple')) {
        return value.toFixed(2) + 'x';
      } else {
        return value.toFixed(2);
      }
    }
    return value;
  };

  // Helper function to determine the change direction
  const getChangeDirection = (key: string, baseValue: any, compareValue: any) => {
    if (typeof baseValue !== 'number' || typeof compareValue !== 'number') {
      return null;
    }

    const isPositiveChange = compareValue > baseValue;
    
    // For some metrics, higher is better
    const higherIsBetter = [
      'irr', 'cash_on_cash_return', 'equity_multiple', 'dscr', 'projected_noi',
      'effective_gross_income', 'exit_value'
    ];
    
    // For some metrics, lower is better
    const lowerIsBetter = [
      'exit_cap_rate', 'vacancy_rate', 'operating_expenses', 'loan_amount',
      'interest_rate', 'loan_to_value'
    ];

    let isPositive = false;
    
    if (higherIsBetter.some(metric => key.includes(metric))) {
      isPositive = isPositiveChange;
    } else if (lowerIsBetter.some(metric => key.includes(metric))) {
      isPositive = !isPositiveChange;
    } else {
      return null; // Neutral for metrics we don't have a preference for
    }

    return isPositive ? 'positive' : 'negative';
  };

  // Helper function to render change indicator
  const renderChangeIndicator = (direction: string | null) => {
    if (direction === 'positive') {
      return <ArrowUpIcon className="h-4 w-4 text-green-400" />;
    } else if (direction === 'negative') {
      return <ArrowDownIcon className="h-4 w-4 text-red-400" />;
    } else {
      return <ArrowRightIcon className="h-4 w-4 text-text-secondary" />;
    }
  };

  // Helper function to calculate percentage change
  const calculatePercentageChange = (baseValue: number, compareValue: number) => {
    if (baseValue === 0) return 'N/A';
    const change = ((compareValue - baseValue) / Math.abs(baseValue)) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-dark-card-hover p-4 rounded-lg border border-dark-border">
        <h3 className="text-lg font-medium text-white mb-4">Scenario Comparison</h3>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-text-secondary">
            Comparing <span className="text-white font-medium">{baseScenarioName}</span> with <span className="text-white font-medium">{compareScenarioName}</span>
          </div>
        </div>

        {/* Assumptions Comparison */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-white mb-2">Assumptions</h4>
          <div className="bg-dark-card border border-dark-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-card-hover">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Assumption</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">{baseScenarioName}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">{compareScenarioName}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {Object.entries(comparison.differences.assumptions).map(([key, { base, compare }]) => {
                  const direction = getChangeDirection(key, base, compare);
                  const percentChange = typeof base === 'number' && typeof compare === 'number' 
                    ? calculatePercentageChange(base, compare) 
                    : '';
                  
                  return (
                    <tr key={key} className="hover:bg-dark-card-hover/50">
                      <td className="px-4 py-2 text-sm text-white">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </td>
                      <td className="px-4 py-2 text-sm text-white text-right">
                        {formatValue(key, base)}
                      </td>
                      <td className="px-4 py-2 text-sm text-white text-right">
                        {formatValue(key, compare)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right flex items-center justify-end">
                        {renderChangeIndicator(direction)}
                        <span className={`ml-1 ${
                          direction === 'positive' ? 'text-green-400' : 
                          direction === 'negative' ? 'text-red-400' : 
                          'text-text-secondary'
                        }`}>
                          {percentChange}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Comparison */}
        <div>
          <h4 className="text-md font-medium text-white mb-2">Results</h4>
          <div className="bg-dark-card border border-dark-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-card-hover">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">Metric</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">{baseScenarioName}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">{compareScenarioName}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-text-secondary">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {Object.entries(comparison.differences.results).map(([key, { base, compare }]) => {
                  const direction = getChangeDirection(key, base, compare);
                  const percentChange = typeof base === 'number' && typeof compare === 'number' 
                    ? calculatePercentageChange(base, compare) 
                    : '';
                  
                  return (
                    <tr key={key} className="hover:bg-dark-card-hover/50">
                      <td className="px-4 py-2 text-sm text-white">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </td>
                      <td className="px-4 py-2 text-sm text-white text-right">
                        {formatValue(key, base)}
                      </td>
                      <td className="px-4 py-2 text-sm text-white text-right">
                        {formatValue(key, compare)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right flex items-center justify-end">
                        {renderChangeIndicator(direction)}
                        <span className={`ml-1 ${
                          direction === 'positive' ? 'text-green-400' : 
                          direction === 'negative' ? 'text-red-400' : 
                          'text-text-secondary'
                        }`}>
                          {percentChange}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
