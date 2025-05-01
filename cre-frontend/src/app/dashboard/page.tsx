'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DealCard } from '@/components/DealCard';
import { Deal, DealSummary } from '@/types/deal';
import { getDeals, getPortfolioSummary } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<DealSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch deals and portfolio summary
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dealsData, summaryData] = await Promise.all([
          getDeals(),
          getPortfolioSummary(),
        ]);
        setDeals(dealsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar className="w-64 hidden md:block" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Deals</p>
                    <p className="text-2xl font-bold">{summary.total_deals}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Acquisition Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.total_acquisition_price)}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Average IRR</p>
                    <p className="text-2xl font-bold">{formatPercent(summary.average_irr)}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Average DSCR</p>
                    <p className="text-2xl font-bold">{summary.average_dscr.toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              {/* Status Breakdown */}
              {summary && summary.status_counts && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <h2 className="text-lg font-semibold mb-4">Deal Status</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(summary.status_counts).map(([status, count]) => (
                      <div key={status} className="text-center">
                        <div className="inline-block w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 text-blue-800 text-xl font-bold">
                          {count}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Deals */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Deals</h2>
                  <button
                    onClick={() => router.push('/deals')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                
                {deals.length === 0 ? (
                  <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-gray-500">No deals found</p>
                    <button
                      onClick={() => router.push('/deals/new')}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Create New Deal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deals.slice(0, 6).map((deal) => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
