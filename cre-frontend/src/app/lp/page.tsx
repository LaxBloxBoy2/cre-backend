'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Deal } from '@/types/deal';
import { getDeals } from '@/lib/api';

export default function LPPortalPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch deals
    const fetchDeals = async () => {
      setIsLoading(true);
      try {
        const dealsData = await getDeals();
        // Filter for approved deals only for LP portal
        const approvedDeals = dealsData.filter(deal => deal.status === 'approved');
        setDeals(approvedDeals);
      } catch (error) {
        console.error('Error fetching deals:', error);
        setError('Failed to load deals. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">LP Portal</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading deals...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">No approved deals available for LP viewing</p>
            </div>
          ) : (
            <>
              {/* Portfolio Summary */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Portfolio Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Investments</p>
                    <p className="text-xl font-bold">{deals.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        deals.reduce((sum, deal) => sum + deal.acquisition_price + deal.construction_cost, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average IRR</p>
                    <p className="text-xl font-bold">
                      {formatPercent(
                        deals.reduce((sum, deal) => sum + (deal.irr || 0), 0) / deals.length
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average DSCR</p>
                    <p className="text-xl font-bold">
                      {(
                        deals.reduce((sum, deal) => sum + (deal.dscr || 0), 0) / deals.length
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Deals Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Investment Opportunities</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IRR
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{deal.project_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{deal.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{deal.property_type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatCurrency(deal.acquisition_price + deal.construction_cost)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {deal.irr ? formatPercent(deal.irr) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/deals/${deal.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
