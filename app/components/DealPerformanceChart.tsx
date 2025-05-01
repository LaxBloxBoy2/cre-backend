'use client';

import { useState } from 'react';

interface DealPerformanceChartProps {
  dealId: string;
}

export default function DealPerformanceChart({ dealId }: DealPerformanceChartProps) {
  const [chartType, setChartType] = useState<'quarterly' | 'cumulative'>('quarterly');

  // Mock data for the chart
  const quarterlyData = [
    { name: 'Q1 2023', projected: 2.5, actual: 2.3 },
    { name: 'Q2 2023', projected: 2.7, actual: 2.8 },
    { name: 'Q3 2023', projected: 2.9, actual: 3.1 },
    { name: 'Q4 2023', projected: 3.1, actual: 3.2 },
    { name: 'Q1 2024', projected: 3.3, actual: 3.4 },
  ];

  const cumulativeData = [
    { name: 'Q1 2023', projected: 2.5, actual: 2.3 },
    { name: 'Q2 2023', projected: 5.2, actual: 5.1 },
    { name: 'Q3 2023', projected: 8.1, actual: 8.2 },
    { name: 'Q4 2023', projected: 11.2, actual: 11.4 },
    { name: 'Q1 2024', projected: 14.5, actual: 14.8 },
  ];

  const data = chartType === 'quarterly' ? quarterlyData : cumulativeData;

  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => Math.max(item.projected, item.actual)));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Performance</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('quarterly')}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              chartType === 'quarterly'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setChartType('cumulative')}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              chartType === 'cumulative'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Simple chart alternative */}
      <div className="h-64 w-full bg-dark-card-hover/30 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-text-secondary">{item.name}</div>
          ))}
        </div>

        <div className="flex h-48 items-end justify-between">
          {data.map((item, index) => {
            // Calculate height percentage based on value
            const projectedHeight = (item.projected / maxValue) * 100;
            const actualHeight = (item.actual / maxValue) * 100;

            return (
              <div key={index} className="flex items-end justify-center w-1/5 space-x-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 bg-purple-500 rounded-t-sm"
                    style={{ height: `${projectedHeight}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-text-secondary rotate-90 origin-top-left absolute">
                    {item.projected.toFixed(1)}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className="w-6 bg-accent rounded-t-sm"
                    style={{ height: `${actualHeight}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-text-secondary rotate-90 origin-top-left absolute">
                    {item.actual.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-sm mr-2"></div>
            <span className="text-xs text-text-secondary">Projected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-accent rounded-sm mr-2"></div>
            <span className="text-xs text-text-secondary">Actual</span>
          </div>
        </div>
      </div>
    </div>
  );
}
