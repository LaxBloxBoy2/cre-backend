'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { AIChat } from '@/components/AIChat';
import { MemoViewer } from '@/components/MemoViewer';
import { TermBuilder } from '@/components/TermBuilder';
import { Deal } from '@/types/deal';
import { getDeal } from '@/lib/api';

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch deal details
    const fetchDeal = async () => {
      setIsLoading(true);
      try {
        const dealData = await getDeal(params.id);
        setDeal(dealData);
      } catch (error) {
        console.error('Error fetching deal:', error);
        setError('Failed to load deal details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeal();
  }, [params.id, router]);

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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar className="w-64 hidden md:block" />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading deal details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : deal ? (
            <>
              {/* Deal Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{deal.project_name}</h1>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{deal.property_type}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{deal.location}</span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => router.push('/deals')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back to Deals
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('financing')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'financing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Financing
                  </button>
                  <button
                    onClick={() => setActiveTab('memo')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'memo'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Investment Memo
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'ai'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    AI Assistant
                  </button>
                  <button
                    onClick={() => router.push(`/deals/${params.id}/scenarios`)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'scenarios'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Scenarios
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-5 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Deal Overview</h2>
                  </div>

                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Property Details</h3>
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500">Property Type</p>
                            <p className="text-sm font-medium">{deal.property_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium">{deal.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Square Footage</p>
                            <p className="text-sm font-medium">{deal.square_footage.toLocaleString()} SF</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Financial Details</h3>
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500">Acquisition Price</p>
                            <p className="text-sm font-medium">{formatCurrency(deal.acquisition_price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Construction Cost</p>
                            <p className="text-sm font-medium">{formatCurrency(deal.construction_cost)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Project Cost</p>
                            <p className="text-sm font-medium">{formatCurrency(deal.acquisition_price + deal.construction_cost)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Performance Metrics</h3>
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500">Projected Rent per SF</p>
                            <p className="text-sm font-medium">${deal.projected_rent_per_sf.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vacancy Rate</p>
                            <p className="text-sm font-medium">{formatPercent(deal.vacancy_rate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Operating Expenses per SF</p>
                            <p className="text-sm font-medium">${deal.operating_expenses_per_sf.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Exit Cap Rate</p>
                            <p className="text-sm font-medium">{formatPercent(deal.exit_cap_rate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">IRR</p>
                            <p className="text-sm font-medium">{deal.irr ? formatPercent(deal.irr) : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">DSCR</p>
                            <p className="text-sm font-medium">{deal.dscr ? deal.dscr.toFixed(2) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financing' && (
                <TermBuilder deal={deal} />
              )}

              {activeTab === 'memo' && (
                <MemoViewer deal={deal} />
              )}

              {activeTab === 'ai' && (
                <AIChat deal={deal} />
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              Deal not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
