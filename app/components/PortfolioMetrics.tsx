'use client';

import { useState } from 'react';
import MetricExplainer from './MetricExplainer';

interface PortfolioMetricsProps {
  metrics?: {
    totalInvested: number;
    averageIRR: number;
    averageEquityMultiple: number;
    totalDeals: number;
  };
}

export default function PortfolioMetrics({ metrics }: PortfolioMetricsProps) {
  // Default mock data if none provided
  const defaultMetrics = {
    totalInvested: 5250000,
    averageIRR: 13.7,
    averageEquityMultiple: 1.9,
    totalDeals: 3
  };
  
  const data = metrics || defaultMetrics;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-dark-card-hover p-4 rounded-lg relative">
        <div className="flex items-center">
          <p className="text-sm font-medium text-text-secondary">Total Invested</p>
          <MetricExplainer metric="total_invested" value={formatCurrency(data.totalInvested)} />
        </div>
        <p className="text-xl font-semibold text-white">{formatCurrency(data.totalInvested)}</p>
      </div>
      
      <div className="bg-dark-card-hover p-4 rounded-lg relative">
        <div className="flex items-center">
          <p className="text-sm font-medium text-text-secondary">Avg. Target IRR</p>
          <MetricExplainer metric="average_irr" value={`${data.averageIRR}%`} />
        </div>
        <p className="text-xl font-semibold text-accent">{data.averageIRR}%</p>
      </div>
      
      <div className="bg-dark-card-hover p-4 rounded-lg relative">
        <div className="flex items-center">
          <p className="text-sm font-medium text-text-secondary">Avg. Equity Multiple</p>
          <MetricExplainer metric="average_equity_multiple" value={`${data.averageEquityMultiple}x`} />
        </div>
        <p className="text-xl font-semibold text-white">{data.averageEquityMultiple}x</p>
      </div>
      
      <div className="bg-dark-card-hover p-4 rounded-lg relative">
        <div className="flex items-center">
          <p className="text-sm font-medium text-text-secondary">Total Deals</p>
          <MetricExplainer metric="total_deals" value={data.totalDeals.toString()} />
        </div>
        <p className="text-xl font-semibold text-white">{data.totalDeals}</p>
      </div>
    </div>
  );
}
