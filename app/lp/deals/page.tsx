'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import LPSettingsToggle from '../../components/LPSettingsToggle';
import LPNotifications from '../../components/LPNotifications';
import PortfolioSummaryChart from '../../components/PortfolioSummaryChart';
import PortfolioMetrics from '../../components/PortfolioMetrics';

interface Deal {
  id: string;
  project_name: string;
  location: string;
  property_type: string;
  acquisition_price: number;
  construction_cost: number;
  square_footage: number;
  projected_rent_per_sf: number;
  vacancy_rate: number;
  operating_expenses_per_sf: number;
  exit_cap_rate: number;
  status: string;
  created_at: string;
  target_irr: number;
  target_equity_multiple: number;
  investment_period: number;
}

export default function LPDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch LP deals
    const fetchDeals = async () => {
      setLoading(true);
      try {
        // In a real app, we would call the API
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockDeals: Deal[] = [
          {
            id: '1',
            project_name: 'Downtown Office Tower',
            location: 'New York, NY',
            property_type: 'office',
            acquisition_price: 15000000,
            construction_cost: 5000000,
            square_footage: 50000,
            projected_rent_per_sf: 45,
            vacancy_rate: 5,
            operating_expenses_per_sf: 15,
            exit_cap_rate: 5.5,
            status: 'active',
            created_at: '2023-01-15T12:00:00Z',
            target_irr: 12.5,
            target_equity_multiple: 1.8,
            investment_period: 5,
          },
          {
            id: '2',
            project_name: 'Oakwood Heights',
            location: 'Austin, TX',
            property_type: 'multifamily',
            acquisition_price: 22000000,
            construction_cost: 3500000,
            square_footage: 75000,
            projected_rent_per_sf: 28,
            vacancy_rate: 4,
            operating_expenses_per_sf: 12,
            exit_cap_rate: 4.8,
            status: 'active',
            created_at: '2022-09-15T12:00:00Z',
            target_irr: 14.2,
            target_equity_multiple: 2.1,
            investment_period: 7,
          },
          {
            id: '3',
            project_name: 'Riverside Plaza',
            location: 'Chicago, IL',
            property_type: 'retail',
            acquisition_price: 18500000,
            construction_cost: 2200000,
            square_footage: 65000,
            projected_rent_per_sf: 32,
            vacancy_rate: 8,
            operating_expenses_per_sf: 14,
            exit_cap_rate: 6.2,
            status: 'fundraising',
            created_at: '2023-05-01T12:00:00Z',
            target_irr: 13.5,
            target_equity_multiple: 1.9,
            investment_period: 6,
          },
        ];

        setDeals(mockDeals);
      } catch (error) {
        console.error('Error fetching LP deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [router]);

  const filteredDeals = filter === 'all'
    ? deals
    : deals.filter(deal => deal.status === filter);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'fundraising':
        return 'bg-purple-900/60 text-purple-200';
      case 'active':
        return 'bg-green-900/60 text-green-200';
      case 'exited':
        return 'bg-blue-900/60 text-blue-200';
      default:
        return 'bg-gray-800 text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Portfolio Summary Section */}
      <div className="dark-card shadow-lg rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Portfolio Overview</h2>
          <PortfolioMetrics />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dark-card-hover p-4 rounded-lg">
              <PortfolioSummaryChart />
            </div>
            <div className="dark-card-hover p-4 rounded-lg">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center mr-2">
                        <span className="h-2 w-2 rounded-full bg-accent"></span>
                      </div>
                      <div>
                        <p className="text-sm text-white">Quarterly update for <span className="text-accent">Downtown Office Tower</span></p>
                        <p className="text-xs text-text-secondary">2 days ago</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      </div>
                      <div>
                        <p className="text-sm text-white">New investment opportunity: <span className="text-accent">Riverside Plaza</span></p>
                        <p className="text-xs text-text-secondary">5 days ago</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      </div>
                      <div>
                        <p className="text-sm text-white">Distribution processed for <span className="text-accent">Oakwood Heights</span></p>
                        <p className="text-xs text-text-secondary">1 week ago</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button className="text-sm text-accent hover:text-accent/80 transition-colors">
                    View all activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Opportunities Section */}
      <div className="dark-card shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 sm:mb-0">Investment Opportunities</h2>
            <div className="flex items-center space-x-4">
              <LPNotifications />
              <LPSettingsToggle />
              <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === 'all' ? 'bg-dark-card-hover text-accent shadow-accent-glow' : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('fundraising')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === 'fundraising' ? 'bg-dark-card-hover text-accent shadow-accent-glow' : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
                }`}
              >
                Fundraising
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === 'active' ? 'bg-dark-card-hover text-accent shadow-accent-glow' : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('exited')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === 'exited' ? 'bg-dark-card-hover text-accent shadow-accent-glow' : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
                }`}
              >
                Exited
              </button>
              </div>
            </div>
          </div>

          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No deals found</h3>
              <p className="mt-1 text-sm text-text-secondary">
                {filter === 'all'
                  ? 'You have no investment opportunities at this time.'
                  : `You have no ${filter} investment opportunities.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDeals.map((deal) => (
                <div key={deal.id} className="dark-card-hover overflow-hidden shadow-lg rounded-lg border border-dark-border hover:border-accent/50 transition-all duration-200 hover:shadow-accent-glow/20">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-white truncate">{deal.project_name}</h3>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          deal.status === 'fundraising' ? 'bg-purple-900/60 text-purple-200' :
                          deal.status === 'active' ? 'bg-green-900/60 text-green-200' :
                          deal.status === 'exited' ? 'bg-blue-900/60 text-blue-200' :
                          'bg-gray-800 text-gray-200'
                        }`}
                      >
                        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{deal.location}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {deal.property_type.charAt(0).toUpperCase() + deal.property_type.slice(1).replace('_', ' ')}
                    </p>

                    <div className="mt-4 border-t border-dark-border pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-text-secondary">Target IRR</p>
                          <p className="text-sm font-semibold text-accent">{deal.target_irr}%</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-secondary">Equity Multiple</p>
                          <p className="text-sm font-semibold text-white">{deal.target_equity_multiple}x</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-secondary">Investment Period</p>
                          <p className="text-sm font-semibold text-white">{deal.investment_period} years</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-secondary">Total Project Cost</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(deal.acquisition_price + deal.construction_cost)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/lp/deals/${deal.id}`}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
