'use client';

import { useRiskScore } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';

export default function RiskGauge() {
  const { data, isLoading, error } = useRiskScore();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    console.error('Error loading risk score data:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackData = {
    score: 65,
    factors: [
      'Market volatility in the region',
      'Tenant concentration risk',
      'Potential zoning changes',
      'Rising interest rates'
    ]
  };

  // Use real data if available, otherwise fallback
  const displayData = data || fallbackData;

  // Determine color based on score
  const getColor = (score: number) => {
    if (score < 30) return '#10B981'; // Green for low risk
    if (score < 70) return '#F59E0B'; // Yellow for medium risk
    return '#EF4444'; // Red for high risk
  };

  const color = getColor(displayData.score);
  const angle = (displayData.score / 100) * 180; // Convert score to angle (0-180 degrees)

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Risk Assessment</h3>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Global Score</span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-24">
          {/* Gauge background */}
          <div className="absolute w-full h-full rounded-t-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-20 rounded-t-full"></div>
          </div>

          {/* Gauge needle */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-24 origin-bottom transform -translate-x-1/2 transition-all duration-1000"
            style={{
              backgroundColor: 'var(--text-primary)',
              transform: `translateX(-50%) rotate(${angle - 90}deg)`
            }}
          >
            <div className="absolute top-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 shadow-accent-glow" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          </div>

          {/* Score display */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
            <span className="text-3xl font-bold" style={{ color }}>
              {displayData.score}
            </span>
            <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>/ 100</span>
          </div>

          {/* Scale markers */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-2">
            <span className="text-xs text-green-500">Low</span>
            <span className="text-xs text-yellow-500">Medium</span>
            <span className="text-xs text-red-500">High</span>
          </div>
        </div>
      </div>

      {/* Risk factors */}
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Risk Factors:</h4>
        <ul className="space-y-1">
          {displayData.factors && displayData.factors.length > 0 ? (
            displayData.factors.map((factor, index) => (
              <li key={index} className="text-xs flex items-start" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1 mr-2"></span>
                {factor}
              </li>
            ))
          ) : (
            <li className="text-xs" style={{ color: 'var(--text-muted)' }}>No significant risk factors detected</li>
          )}
        </ul>
      </div>
    </div>
  );
}
