'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getDeal, runUnderwriting, updateDeal, deleteDeal } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/utils/format';
import { formatDate, calculateMonthsBetween } from '../../lib/utils/date';
import AIChatTab from '../../components/AIChatTab';
import MemoTab from '../../components/MemoTab';
import DocumentsTab from '../../components/DocumentsTab';
import { InvoicesTab } from '../../components/InvoicesTab';
import IntegrationsTab from '../../components/IntegrationsTab';
import MetricExplainer from '../../components/MetricExplainer';
import PropertyAttributes from '../../components/deal-overview/PropertyAttributes';
import GoogleMap from '../../components/deal-overview/GoogleMap';
import InvestmentStrategyCard from '../../components/deal-overview/InvestmentStrategyCard';
import NotesBox from '../../components/deal-overview/NotesBox';
import SellerPropensityCard from '../../components/deal-overview/SellerPropensityCard';
import OwnerStatsCard from '../../components/deal-overview/OwnerStatsCard';
import ActivityLog from '../../components/deal-overview/ActivityLog';
import UnderwritingButton from '../../components/UnderwritingButton';
import { usePermissions } from '../../hooks/usePermissions';
import { Edit, Trash2 } from 'lucide-react';

interface Deal {
  id: string;
  project_name: string;
  location: string;
  property_type: string;
  property_class?: string;
  property_style?: string;
  property_subtype?: string;
  year_built?: string;
  units?: number;
  acquisition_price: number;
  construction_cost: number;
  square_footage: number;
  lot_size?: string;
  zoning?: string;
  parking_spaces?: number;
  projected_rent_per_sf: number;
  vacancy_rate: number;
  operating_expenses_per_sf: number;
  exit_cap_rate: number;
  status: string;
  created_at: string;
  acquisition_date?: string;
  strategy?: string;
  // Integration settings
  integrate_with_leases?: boolean;
  integrate_with_documents?: boolean;
  integrate_with_calendar?: boolean;
}

interface CalculatedMetrics {
  total_project_cost: number;
  gross_potential_income: number;
  effective_gross_income: number;
  operating_expenses: number;
  net_operating_income: number;
  cap_rate: number;
  cash_on_cash_return: number;
  debt_service_coverage_ratio: number;
  irr_5_year: number;
}

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { canEditDeals, canDeleteDeals } = usePermissions();

  const { showToast } = useToast();

  const fetchDealData = async () => {
    try {
      setLoading(true);
      const dealData = await getDeal(params.id as string);
      setDeal(dealData);
      calculateMetrics(dealData);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast('Failed to load deal data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDealData();
  }, [router, params.id]);

  // Calculate financial metrics based on deal data
  const calculateMetrics = (dealData: Deal) => {
    const totalProjectCost = dealData.acquisition_price + dealData.construction_cost;
    const gpi = dealData.square_footage * dealData.projected_rent_per_sf;
    const egi = gpi * (1 - dealData.vacancy_rate / 100);
    const opex = dealData.square_footage * dealData.operating_expenses_per_sf;
    const noi = egi - opex;
    const capRate = (noi / totalProjectCost) * 100;

    // Simplified calculations for demo purposes
    const debtServiceCoverage = noi / (totalProjectCost * 0.08); // Assuming 8% debt service
    const cashOnCash = (noi - (totalProjectCost * 0.06)) / (totalProjectCost * 0.35) * 100; // Assuming 65% LTV and 6% interest
    const irr5Year = 12.5; // Simplified IRR calculation

    setMetrics({
      total_project_cost: totalProjectCost,
      gross_potential_income: gpi,
      effective_gross_income: egi,
      operating_expenses: opex,
      net_operating_income: noi,
      cap_rate: capRate,
      cash_on_cash_return: cashOnCash,
      debt_service_coverage_ratio: debtServiceCoverage,
      irr_5_year: irr5Year,
    });
  };

  // Using imported formatting functions from utils

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-dark-card-hover text-text-secondary';
      case 'in_review':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'approved':
        return 'bg-green-900/30 text-green-400';
      case 'rejected':
        return 'bg-red-900/30 text-red-400';
      case 'archived':
        return 'bg-purple-900/30 text-purple-400';
      default:
        return 'bg-dark-card-hover text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Loading Deal...</h1>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Deal Not Found</h1>
          <Link
            href="/deals"
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
          >
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="shadow-lg border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <svg className="h-6 w-6" style={{ color: 'var(--accent)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{deal.project_name}</h1>
                <span className="ml-3 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--accent)' }}>
                  {deal.status.charAt(0).toUpperCase() + deal.status.slice(1).replace('_', ' ')}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{deal.location}</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/deals"
              className="px-4 py-2 rounded-md transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
            >
              Back to Deals
            </Link>
            {canEditDeals && (
              <>
                <button
                  className="px-4 py-2 rounded-md transition-all duration-200 flex items-center"
                  style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
                  onClick={() => router.push(`/deals/${params.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Deal
                </button>
                <button
                  className="px-4 py-2 rounded-md transition-all duration-200 flex items-center"
                  style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--accent)' }}
                  onClick={() => {
                    // Simple direct edit functionality
                    const newName = prompt("Enter new project name:", deal?.project_name);
                    if (newName && newName !== deal?.project_name) {
                      // Update the deal directly in localStorage
                      const updatedDeal = { ...deal, project_name: newName, updated_at: new Date().toISOString() };
                      localStorage.setItem(`demo_deal_${params.id}`, JSON.stringify(updatedDeal));
                      // Update the UI
                      setDeal(updatedDeal);
                      showToast('Deal updated successfully', 'success');
                      // Force reload to see changes
                      window.location.reload();
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Quick Edit
                </button>
                <button
                  className="px-4 py-2 rounded-md transition-all duration-200 flex items-center"
                  style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
                  onClick={() => {
                    // Store the current deal in localStorage first
                    localStorage.setItem(`demo_deal_${params.id}`, JSON.stringify(deal));
                    // Navigate to the direct edit page
                    router.push(`/deals/${params.id}/direct-edit`);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Direct Edit
                </button>
              </>
            )}
            {canDeleteDeals && (
              <button
                className="px-4 py-2 rounded-md transition-all duration-200 flex items-center text-red-500 dark:text-red-400"
                style={{ backgroundColor: 'var(--bg-card-hover)' }}
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete ${deal?.project_name}?`)) {
                    try {
                      setLoading(true);
                      await deleteDeal(params.id as string);
                      showToast('Deal deleted successfully', 'success');
                      router.push('/deals');
                    } catch (error) {
                      console.error('Error deleting deal:', error);
                      showToast('Failed to delete deal. Please try again.', 'error');
                      setLoading(false);
                    }
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
            <UnderwritingButton deal={deal} directLink={true} />
            <button
              className="px-4 py-2 bg-gradient-to-r from-[#30E3CA] to-[#11999E] text-white rounded-md hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
              onClick={() => setActiveTab('ai_chat')}
            >
              AI Chat
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <nav className="flex space-x-4 overflow-x-auto p-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'overview' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'overview' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'financials' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'financials' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'financials' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Financials
            </button>
            <button
              onClick={() => router.push(`/deals/${params.id}/scenarios`)}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: false ? 'var(--bg-card-hover)' : 'transparent', // Not active in this page
                color: false ? 'var(--accent)' : 'var(--text-muted)', // Not active in this page
                margin: '2px'
              }}
            >
              Scenarios
            </button>
            <button
              onClick={() => router.push(`/deals/${params.id}/underwriting`)}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: false ? 'var(--bg-card-hover)' : 'transparent', // Not active in this page
                color: false ? 'var(--accent)' : 'var(--text-muted)', // Not active in this page
                margin: '2px'
              }}
            >
              Underwriting
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'documents' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'documents' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'documents' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'invoices' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'invoices' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'invoices' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('memo')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'memo' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'memo' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'memo' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Investment Memo
            </button>
            <button
              onClick={() => setActiveTab('ai_chat')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'ai_chat' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'ai_chat' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'ai_chat' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'integrations' ? 'var(--bg-card-hover)' : 'transparent',
                color: activeTab === 'integrations' ? 'var(--accent)' : 'var(--text-muted)',
                border: activeTab === 'integrations' ? '1px solid var(--accent)' : '1px solid transparent',
                margin: '2px'
              }}
            >
              Integrations
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="sm:col-span-1">
              <PropertyAttributes
                deal={{
                  ...deal,
                  onUpdate: (updatedDeal: any) => {
                    setDeal(updatedDeal);
                    calculateMetrics(updatedDeal);
                  }
                }}
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-1">
              <GoogleMap location={deal.location} dealId={deal.id} />
              <InvestmentStrategyCard deal={deal} />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <NotesBox dealId={deal.id} />
              <SellerPropensityCard deal={deal} />
              <OwnerStatsCard deal={deal} />
              <ActivityLog dealId={deal.id} />
            </div>
          </div>
        )}

        {activeTab === 'financials' && metrics && (
          <div className="overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium mb-6" style={{ color: 'var(--text-primary)' }}>Financial Analysis</h3>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="overflow-hidden shadow-lg rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>Total Project Cost</dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.total_project_cost)}</dd>
                  </div>
                </div>

                <div className="overflow-hidden shadow-lg rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>Net Operating Income</dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.net_operating_income)}</dd>
                  </div>
                </div>

                <div className="overflow-hidden shadow-lg rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>Cap Rate</dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(metrics.cap_rate)}</dd>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-md font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Income Statement</h4>
                  <div className="border rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-dark)' }}>
                    <dl className="divide-y" style={{ borderColor: 'var(--border-dark)' }}>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Gross Potential Income</dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.gross_potential_income)}</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Vacancy Loss ({deal.vacancy_rate}%)</dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>
                          ({formatCurrency(metrics.gross_potential_income * (deal.vacancy_rate / 100))})
                        </dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Effective Gross Income</dt>
                        <dd className="mt-1 text-sm font-medium sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(metrics.effective_gross_income)}</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Operating Expenses</dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>({formatCurrency(metrics.operating_expenses)})</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                        <dt className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Net Operating Income</dt>
                        <dd className="mt-1 text-sm font-medium sm:mt-0 text-right" style={{ color: 'var(--accent)' }}>{formatCurrency(metrics.net_operating_income)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Investment Metrics</h4>
                  <div className="border rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-dark)' }}>
                    <dl className="divide-y" style={{ borderColor: 'var(--border-dark)' }}>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                          Cap Rate
                          <MetricExplainer dealId={deal.id} metric="cap_rate" value={metrics.cap_rate} />
                        </dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{formatPercentage(metrics.cap_rate)}</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                          Cash on Cash Return
                          <MetricExplainer dealId={deal.id} metric="cash_on_cash" value={metrics.cash_on_cash_return} />
                        </dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{formatPercentage(metrics.cash_on_cash_return)}</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                          Debt Service Coverage Ratio
                          <MetricExplainer dealId={deal.id} metric="dscr" value={metrics.debt_service_coverage_ratio.toFixed(2)} />
                        </dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{metrics.debt_service_coverage_ratio.toFixed(2)}x</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                          5-Year IRR
                          <MetricExplainer dealId={deal.id} metric="irr" value={metrics.irr_5_year} />
                        </dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{formatPercentage(metrics.irr_5_year)}</dd>
                      </div>
                      <div className="px-4 py-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                          Exit Cap Rate
                          <MetricExplainer dealId={deal.id} metric="exit_cap_rate" value={deal.exit_cap_rate} />
                        </dt>
                        <dd className="mt-1 text-sm sm:mt-0 text-right" style={{ color: 'var(--text-primary)' }}>{deal.exit_cap_rate}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && <DocumentsTab dealId={deal.id} />}

        {activeTab === 'invoices' && <InvoicesTab dealId={deal.id} />}

        {activeTab === 'ai_chat' && <AIChatTab dealId={deal.id} dealData={deal} />}

        {activeTab === 'memo' && <MemoTab dealId={deal.id} dealData={deal} />}

        {activeTab === 'integrations' && <IntegrationsTab dealId={deal.id} dealData={deal} onUpdate={(updatedDeal) => {
          setDeal(updatedDeal);
          calculateMetrics(updatedDeal);
        }} />}
      </main>
    </div>
  );
}
