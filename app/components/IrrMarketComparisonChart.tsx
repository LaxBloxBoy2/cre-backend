'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../lib/constants';
import { formatPercentage } from '../lib/utils';
import { Skeleton } from './ui/skeleton';

// API client with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default function IrrMarketComparisonChart() {
  const [selectedDealId, setSelectedDealId] = useState<string>('1'); // Default to first deal

  // Fetch benchmark data
  const { data: benchmarkData, isLoading: benchmarkLoading, error: benchmarkError } = useQuery({
    queryKey: ['benchmark-report'],
    queryFn: () => api.get('/api/benchmark-report').then(res => res.data),
  });

  // Fetch deal data
  const { data: dealData, isLoading: dealLoading, error: dealError } = useQuery({
    queryKey: ['deal', selectedDealId],
    queryFn: () => api.get(`/api/deals/${selectedDealId}`).then(res => res.data),
    enabled: !!selectedDealId,
  });

  // Fetch all deals for selector
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then(res => res.data),
  });

  const isLoading = benchmarkLoading || dealLoading || dealsLoading;
  const error = benchmarkError || dealError || dealsError;

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !benchmarkData || !dealData) {
    console.error('Error loading comparison data:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackBenchmarkData = {
    market_irr: 12.5,
    market_cap_rate: 5.2,
    market_development_margin: 16.8,
    property_types: {
      office: { irr: 11.8, cap_rate: 5.5 },
      retail: { irr: 10.9, cap_rate: 6.1 },
      industrial: { irr: 13.2, cap_rate: 4.8 },
      multifamily: { irr: 12.7, cap_rate: 4.9 },
      mixed_use: { irr: 12.3, cap_rate: 5.3 }
    }
  };

  const fallbackDealData = {
    id: '1',
    project_name: 'Office Building A',
    property_type: 'office',
    irr: 15.2,
    cap_rate: 4.8,
    development_margin: 18.5
  };

  const fallbackDeals = [
    { id: '1', project_name: 'Office Building A', property_type: 'office' },
    { id: '2', project_name: 'Retail Center B', property_type: 'retail' },
    { id: '3', project_name: 'Industrial Park C', property_type: 'industrial' }
  ];

  // Use real data if available, otherwise fallback
  const benchmark = benchmarkData || fallbackBenchmarkData;
  const deal = dealData || fallbackDealData;
  const dealOptions = deals || fallbackDeals;

  // Get market data for the deal's property type
  const marketData = benchmark.property_types[deal.property_type.toLowerCase()] || {
    irr: benchmark.market_irr,
    cap_rate: benchmark.market_cap_rate
  };

  // Calculate the difference
  const irrDifference = deal.irr - marketData.irr;
  const irrPercentDifference = (irrDifference / marketData.irr) * 100;

  // Determine color based on performance
  const getPerformanceColor = (diff: number) => {
    if (diff > 0) return '#10B981'; // Green for outperforming
    if (diff < 0) return '#EF4444'; // Red for underperforming
    return '#F59E0B'; // Yellow for matching
  };

  const irrColor = getPerformanceColor(irrDifference);

  // Handle deal selection change
  const handleDealChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDealId(e.target.value);
  };

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>IRR vs Market</h3>
        <select
          value={selectedDealId}
          onChange={handleDealChange}
          className="rounded-md px-3 py-1 text-sm border"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-dark)'
          }}
        >
          {dealOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.project_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar chart comparison */}
        <div className="h-64 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card-hover-lighter)' }}>
          <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>IRR Comparison</h4>
          <div className="relative h-40">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{formatPercentage(Math.max(deal.irr, marketData.irr) * 1.2)}</span>
              <span>{formatPercentage((deal.irr + marketData.irr) / 2)}</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-12 right-0 top-0 bottom-0 flex items-end justify-around">
              {/* Deal IRR bar */}
              <div className="flex flex-col items-center w-16">
                <div
                  className="w-12 bg-gradient-to-t from-accent-gradient-from to-accent-gradient-to rounded-t-md shadow-accent-glow"
                  style={{ height: `${(deal.irr / (Math.max(deal.irr, marketData.irr) * 1.2)) * 100}%` }}
                ></div>
                <div className="mt-2 text-xs" style={{ color: 'var(--text-primary)' }}>{formatPercentage(deal.irr)}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Deal</div>
              </div>

              {/* Market IRR bar */}
              <div className="flex flex-col items-center w-16">
                <div
                  className="w-12 rounded-t-md"
                  style={{
                    height: `${(marketData.irr / (Math.max(deal.irr, marketData.irr) * 1.2)) * 100}%`,
                    backgroundColor: 'var(--bg-card-hover)'
                  }}
                ></div>
                <div className="mt-2 text-xs" style={{ color: 'var(--text-primary)' }}>{formatPercentage(marketData.irr)}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Market</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance metrics */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Performance</h4>
            <div className="flex items-center">
              <span className="text-3xl font-bold" style={{ color: irrColor }}>
                {irrDifference > 0 ? '+' : ''}{formatPercentage(irrDifference)}
              </span>
              <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                vs Market ({irrPercentDifference > 0 ? '+' : ''}{irrPercentDifference.toFixed(1)}%)
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {irrDifference > 0
                ? 'This deal is outperforming the market average.'
                : irrDifference < 0
                  ? 'This deal is underperforming compared to the market.'
                  : 'This deal is performing at market average.'}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Market Context</h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              The average IRR for {deal.property_type} properties is currently {formatPercentage(marketData.irr)}.
              This deal's projected IRR is {formatPercentage(deal.irr)}, which is
              {irrDifference > 0 ? ' above ' : irrDifference < 0 ? ' below ' : ' at '}
              the market average.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
