'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MemoTab from '../../../components/MemoTab';
import MetricExplainer from '../../../components/MetricExplainer';
import LPSettingsToggle from '../../../components/LPSettingsToggle';
import LPNotifications from '../../../components/LPNotifications';
import DealPerformanceChart from '../../../components/DealPerformanceChart';
import AlertsPanel from '../../../components/AlertsPanel';

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
  investment_summary: string;
  key_highlights: string[];
  risk_factors: string[];
  quarterly_updates: {
    date: string;
    update: string;
    occupancy: number;
    noi: number;
  }[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function LPDealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch deal details
    const fetchDeal = async () => {
      setLoading(true);
      try {
        // In a real app, we would call the API
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock deal data
        // In a real app, we would fetch the specific deal by ID from the API
        // For now, we'll customize the mock data based on the ID
        const dealId = params.id as string;

        // Create different mock deals based on ID
        let mockDeal: Deal;

        if (dealId === '1') {
          mockDeal = {
            id: dealId,
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
          investment_summary: 'Downtown Office Tower is a Class A office building located in the heart of New York City\'s financial district. The property was acquired in January 2023 and is currently undergoing a value-add renovation program to upgrade common areas and improve building systems.',
          key_highlights: [
            'Prime location in Manhattan\'s financial district',
            '92% occupancy with strong tenant roster',
            'Below-market rents with significant mark-to-market opportunity',
            'Value-add renovation program underway',
            'Strong projected returns with 12.5% target IRR'
          ],
          risk_factors: [
            'Office market uncertainty due to remote work trends',
            'Potential for rising interest rates affecting exit cap rates',
            'Construction cost inflation risk for renovation program',
            'Tenant renewal risk for leases expiring in next 24 months'
          ],
          quarterly_updates: [
            {
              date: '2023-03-31',
              update: 'Acquisition closed in January 2023. Renovation planning underway with contractor selection process completed. Leasing activity remains strong with two new tenant inquiries for vacant space.',
              occupancy: 92,
              noi: 1875000,
            },
            {
              date: '2023-06-30',
              update: 'Renovation of main lobby and common areas commenced in May. Two new leases signed at $48/SF, 6.7% above underwritten rents. Building occupancy increased to 94%.',
              occupancy: 94,
              noi: 1920000,
            }
          ]
        };
        } else if (dealId === '2') {
          mockDeal = {
            id: dealId,
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
            investment_summary: 'Oakwood Heights is a 180-unit garden-style apartment community located in a rapidly growing submarket of Austin, TX. The property was acquired in September 2022 and is undergoing a comprehensive value-add renovation program to upgrade unit interiors and enhance community amenities.',
            key_highlights: [
              'Located in one of the fastest growing submarkets in Austin',
              'Value-add opportunity with significant rent growth potential',
              'Strong demographic trends with high-income renter base',
              'Below market rents compared to newer competitive properties',
              'Extensive amenity package including resort-style pool and fitness center'
            ],
            risk_factors: [
              'Increased competition from new supply in the Austin market',
              'Potential economic slowdown affecting job growth',
              'Construction cost inflation affecting renovation budget',
              'Rising interest rates impacting exit cap rates'
            ],
            quarterly_updates: [
              {
                date: '2022-12-31',
                update: 'Acquisition closed in September 2022. Initial property assessment completed and renovation planning underway. Current occupancy at 92% with strong leasing activity.',
                occupancy: 92,
                noi: 1250000,
              },
              {
                date: '2023-03-31',
                update: 'Renovation of first 25 units completed with average rent premiums of $175/month. New property management team implemented improved operational procedures. Occupancy increased to 94%.',
                occupancy: 94,
                noi: 1320000,
              },
              {
                date: '2023-06-30',
                update: 'Renovation of additional 35 units completed. Clubhouse and pool area renovations underway. Occupancy stable at 95% with strong demand for renovated units.',
                occupancy: 95,
                noi: 1380000,
              }
            ]
          };
        } else if (dealId === '3') {
          mockDeal = {
            id: dealId,
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
            investment_summary: 'Riverside Plaza is a grocery-anchored retail center located in a densely populated submarket of Chicago. The property presents a compelling opportunity to acquire a well-located retail asset with stable in-place cash flow and value-add potential through lease-up of vacant space and strategic repositioning.',
            key_highlights: [
              'Grocery-anchored retail center with strong national tenants',
              'Located in densely populated area with high traffic counts',
              'Below market rents with mark-to-market opportunity',
              'Value-add potential through lease-up of vacant space',
              'Defensive retail mix with 60% of tenants in necessity-based categories'
            ],
            risk_factors: [
              'Changing retail landscape and e-commerce competition',
              'Potential economic downturn affecting consumer spending',
              'Tenant renewal risk for leases expiring in next 24 months',
              'Rising interest rates affecting exit cap rates'
            ],
            quarterly_updates: [
              {
                date: '2023-06-30',
                update: 'Acquisition under contract with due diligence completed. Fundraising in progress with 65% of equity committed. Closing expected in Q3 2023.',
                occupancy: 92,
                noi: 1450000,
              }
            ]
          };
        } else {
          // Default deal for any other ID
          mockDeal = {
            id: dealId,
            project_name: 'Investment Property ' + dealId,
            location: 'Various Locations',
            property_type: 'mixed_use',
            acquisition_price: 10000000,
            construction_cost: 2000000,
            square_footage: 40000,
            projected_rent_per_sf: 30,
            vacancy_rate: 5,
            operating_expenses_per_sf: 12,
            exit_cap_rate: 5.5,
            status: 'active',
            created_at: '2023-01-01T12:00:00Z',
            target_irr: 12.0,
            target_equity_multiple: 1.7,
            investment_period: 5,
            investment_summary: 'This is a sample investment property with ID ' + dealId + '. The property offers a balanced risk-return profile with stable cash flow and moderate value-add potential.',
            key_highlights: [
              'Well-located property in growing market',
              'Diversified tenant base with strong credit',
              'Value-add potential through operational improvements',
              'Attractive financing terms secured',
              'Experienced local property management team'
            ],
            risk_factors: [
              'Market competition from new developments',
              'Economic uncertainty affecting tenant demand',
              'Rising operating costs',
              'Regulatory changes affecting property operations'
            ],
            quarterly_updates: [
              {
                date: '2023-03-31',
                update: 'Property performing in line with expectations. Occupancy stable with strong tenant retention.',
                occupancy: 95,
                noi: 1200000,
              }
            ]
          };
        }

        setDeal(mockDeal);

        // Mock chat messages
        setChatMessages([
          {
            role: 'assistant',
            content: 'Hello! I\'m your investment assistant for the Downtown Office Tower property. How can I help you today?',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            role: 'user',
            content: 'What is the current occupancy rate?',
            timestamp: new Date(Date.now() - 86300000),
          },
          {
            role: 'assistant',
            content: 'As of the latest quarterly update (Q2 2023), the Downtown Office Tower has an occupancy rate of 94%, which is up from 92% at acquisition. The property has secured two new leases at $48/SF, which is 6.7% above our underwritten rents.',
            timestamp: new Date(Date.now() - 86200000),
          },
          {
            role: 'user',
            content: 'How is the renovation progressing?',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          },
          {
            role: 'assistant',
            content: 'The renovation program for Downtown Office Tower commenced in May 2023, focusing on the main lobby and common areas. The contractor selection process was completed in Q1, and work is progressing on schedule. The renovations are expected to enhance the property\'s appeal to prospective tenants and support our strategy of increasing rents to market rates.',
            timestamp: new Date(Date.now() - 3500000),
          },
        ]);
      } catch (error) {
        console.error('Error fetching deal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [router, params.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
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
        return 'bg-purple-100 text-purple-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'exited':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="dark-card shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">Deal Not Found</h3>
              <p className="mt-1 text-sm text-text-secondary">The investment opportunity you're looking for doesn't exist or you don't have access.</p>
              <div className="mt-6">
                <Link
                  href="/lp/deals"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
                >
                  Back to Investments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{deal.project_name}</h1>
            <p className="mt-1 text-sm text-text-secondary">{deal.location}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <LPNotifications />
            <LPSettingsToggle />
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
            <Link
              href="/lp/deals"
              className="inline-flex items-center px-4 py-2 border border-dark-border shadow-sm text-sm font-medium rounded-md text-text-secondary bg-dark-card-hover hover:text-white hover:border-accent/50 transition-all duration-200"
            >
              Back to Investments
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex flex-wrap space-x-2 space-y-2 sm:space-y-0 sm:space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
              activeTab === 'updates'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
            }`}
          >
            Quarterly Updates
          </button>
          <button
            onClick={() => setActiveTab('memo')}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
              activeTab === 'memo'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
            }`}
          >
            Investment Memo
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
              activeTab === 'alerts'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2 font-medium text-sm rounded-md transition-all duration-200 ${
              activeTab === 'chat'
                ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
            }`}
          >
            Chat History
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="dark-card shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <h3 className="text-lg leading-6 font-medium text-white mb-4">Investment Summary</h3>
                <p className="text-sm text-text-secondary">{deal.investment_summary}</p>
              </div>

              <div className="sm:col-span-3">
                <h3 className="text-lg leading-6 font-medium text-white mb-4">Key Highlights</h3>
                <ul className="space-y-2">
                  {deal.key_highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-accent mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-text-secondary">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sm:col-span-3">
                <h3 className="text-lg leading-6 font-medium text-white mb-4">Risk Factors</h3>
                <ul className="space-y-2">
                  {deal.risk_factors.map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-text-secondary">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sm:col-span-6">
                <h3 className="text-lg leading-6 font-medium text-white mb-4">Investment Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-dark-card-hover p-4 rounded-lg relative">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-secondary">Target IRR</p>
                      <MetricExplainer dealId={deal.id} metric="irr" value={deal.target_irr} />
                    </div>
                    <p className="text-xl font-semibold text-accent">{deal.target_irr}%</p>
                  </div>
                  <div className="bg-dark-card-hover p-4 rounded-lg relative">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-secondary">Equity Multiple</p>
                      <MetricExplainer dealId={deal.id} metric="equity_multiple" value={deal.target_equity_multiple} />
                    </div>
                    <p className="text-xl font-semibold text-white">{deal.target_equity_multiple}x</p>
                  </div>
                  <div className="bg-dark-card-hover p-4 rounded-lg relative">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-secondary">Investment Period</p>
                      <MetricExplainer dealId={deal.id} metric="investment_period" value={deal.investment_period} />
                    </div>
                    <p className="text-xl font-semibold text-white">{deal.investment_period} years</p>
                  </div>
                  <div className="bg-dark-card-hover p-4 rounded-lg relative">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-secondary">Current Occupancy</p>
                      <MetricExplainer dealId={deal.id} metric="occupancy" value={deal.quarterly_updates[deal.quarterly_updates.length - 1].occupancy} />
                    </div>
                    <p className="text-xl font-semibold text-white">{deal.quarterly_updates[deal.quarterly_updates.length - 1].occupancy}%</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <h3 className="text-lg leading-6 font-medium text-white mb-4">Property Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Property Type</p>
                    <p className="text-sm text-white">{deal.property_type.charAt(0).toUpperCase() + deal.property_type.slice(1).replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Acquisition Price</p>
                    <p className="text-sm text-white">{formatCurrency(deal.acquisition_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Construction Cost</p>
                    <p className="text-sm text-white">{formatCurrency(deal.construction_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Total Project Cost</p>
                    <p className="text-sm text-white">{formatCurrency(deal.acquisition_price + deal.construction_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Square Footage</p>
                    <p className="text-sm text-white">{deal.square_footage.toLocaleString()} SF</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Projected Rent per SF</p>
                    <p className="text-sm text-white">${deal.projected_rent_per_sf.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6 mt-6">
                <div className="dark-card-hover p-4 rounded-lg">
                  <DealPerformanceChart dealId={deal.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="dark-card shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-6">Quarterly Updates</h3>

            <div className="flow-root">
              <ul className="-mb-8">
                {deal.quarterly_updates.map((update, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      {index !== deal.quarterly_updates.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-dark-border" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center ring-8 ring-dark-card">
                            <svg className="h-5 w-5 text-dark-card" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm font-medium text-white">
                              Quarterly Update - {formatDate(update.date)}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-text-secondary">
                            <p>{update.update}</p>
                          </div>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-dark-card-hover p-3 rounded-md">
                              <p className="text-xs font-medium text-text-secondary">Occupancy</p>
                              <p className="text-sm font-semibold text-white">{update.occupancy}%</p>
                            </div>
                            <div className="bg-dark-card-hover p-3 rounded-md">
                              <p className="text-xs font-medium text-text-secondary">Net Operating Income</p>
                              <p className="text-sm font-semibold text-accent">{formatCurrency(update.noi)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'memo' && <MemoTab dealId={deal.id} dealData={deal} />}

      {activeTab === 'alerts' && (
        <div className="dark-card shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <AlertsPanel />
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="dark-card shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-6">Chat History</h3>

            <div className="border border-dark-border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-dark-card-hover/50">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start mb-4 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-dark-card font-medium text-sm">AI</span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`mx-3 p-3 rounded-lg shadow-sm ${
                      message.role === 'user'
                        ? 'bg-dark-card-hover text-white border border-dark-border'
                        : 'bg-dark-card text-white border border-accent/30'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 text-text-secondary">
                      {message.timestamp.toLocaleTimeString()} - {message.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-dark-card-hover border border-dark-border flex items-center justify-center">
                        <span className="text-text-secondary font-medium text-sm">You</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                This is a read-only view of your conversation history. To ask new questions, please contact your investment manager.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
