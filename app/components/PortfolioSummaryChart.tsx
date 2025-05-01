'use client';

import { useState } from 'react';

interface PortfolioSummaryChartProps {
  data?: {
    propertyTypes: { name: string; value: number; color: string }[];
    statusDistribution: { name: string; value: number; color: string }[];
  };
}

export default function PortfolioSummaryChart({ data }: PortfolioSummaryChartProps) {
  const [chartType, setChartType] = useState<'property' | 'status'>('property');

  // Default mock data if none provided
  const defaultData = {
    propertyTypes: [
      { name: 'Office', value: 35, color: '#36FFB0' },
      { name: 'Multifamily', value: 25, color: '#6366F1' },
      { name: 'Retail', value: 20, color: '#F472B6' },
      { name: 'Industrial', value: 15, color: '#FBBF24' },
      { name: 'Mixed Use', value: 5, color: '#8B5CF6' },
    ],
    statusDistribution: [
      { name: 'Active', value: 60, color: '#36FFB0' },
      { name: 'Fundraising', value: 25, color: '#8B5CF6' },
      { name: 'Exited', value: 15, color: '#60A5FA' },
    ],
  };

  const chartData = data || defaultData;
  const currentData = chartType === 'property' ? chartData.propertyTypes : chartData.statusDistribution;

  // Calculate total for percentages
  const total = currentData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Portfolio Summary</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('property')}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              chartType === 'property'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
            }`}
          >
            Property Type
          </button>
          <button
            onClick={() => setChartType('status')}
            className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
              chartType === 'status'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
            }`}
          >
            Status
          </button>
        </div>
      </div>

      <div className="h-64 w-full flex">
        {/* Simple pie chart alternative */}
        <div className="w-1/2 h-full flex items-center justify-center">
          <div className="relative w-40 h-40">
            {currentData.map((entry, index) => {
              // Calculate the percentage and angles for the pie segments
              const percentage = (entry.value / total) * 100;
              let previousSegmentsTotal = 0;

              for (let i = 0; i < index; i++) {
                previousSegmentsTotal += (currentData[i].value / total) * 100;
              }

              const startAngle = (previousSegmentsTotal / 100) * 360;
              const endAngle = ((previousSegmentsTotal + percentage) / 100) * 360;

              // Create a conic gradient for each segment
              const conicGradient = `conic-gradient(
                ${entry.color} ${startAngle}deg,
                ${entry.color} ${endAngle}deg,
                transparent ${endAngle}deg,
                transparent ${startAngle + 360}deg
              )`;

              return (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: conicGradient,
                    clipPath: 'circle(50%)',
                  }}
                ></div>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-dark-card-hover w-20 h-20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-1/2 h-full flex flex-col justify-center space-y-2 pl-4">
          {currentData.map((entry, index) => {
            const percentage = ((entry.value / total) * 100).toFixed(0);

            return (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-xs text-text-secondary">
                  {entry.name} <span className="text-white ml-1">{percentage}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
