'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable, SearchInput, Badge, Tabs } from '../components/ui';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../contexts/ToastContext';
import { getDeals, deleteDeal } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

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
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { canEditDeals, canDeleteDeals } = usePermissions();
  const { showToast } = useToast();

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await getDeals();
      if (response && response.deals) {
        setDeals(response.deals);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      showToast('Failed to load deals. Please try again.', 'error');
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

    fetchDeals();
  }, [router, showToast]);

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
      case 'draft':
        return 'bg-gray-200 dark:bg-dark-card-hover text-gray-700 dark:text-text-secondary';
      case 'in_review':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'archived':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      default:
        return 'bg-gray-200 dark:bg-dark-card-hover text-gray-700 dark:text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Loading Deals...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="shadow-lg border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Deals</h1>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                '&:hover': { color: 'var(--text-primary)' }
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/deals/new"
              className="px-4 py-2 bg-gradient-to-r from-[#30E3CA] to-[#11999E] text-white rounded-md hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
            >
              New Deal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h2 className="text-lg font-medium mb-4 sm:mb-0" style={{ color: 'var(--text-primary)' }}>All Deals</h2>
              <div className="flex space-x-2">
                <Tabs
                  tabs={[
                    { id: 'all', label: 'All' },
                    { id: 'draft', label: 'Draft' },
                    { id: 'in_review', label: 'In Review' },
                    { id: 'approved', label: 'Approved' },
                  ]}
                  activeTab={filter}
                  onChange={setFilter}
                  variant="pills"
                />
              </div>
            </div>

            <div className="mb-4">
              <SearchInput
                placeholder="Search deals..."
                className="max-w-md"
              />
            </div>

            <DataTable
              data={filteredDeals}
              columns={[
                {
                  key: 'project_name',
                  header: 'Project Name',
                  render: (deal) => (
                    <div className="font-medium">{deal.project_name}</div>
                  )
                },
                {
                  key: 'location',
                  header: 'Location',
                },
                {
                  key: 'property_type',
                  header: 'Property Type',
                  render: (deal) => (
                    <div>{deal.property_type.charAt(0).toUpperCase() + deal.property_type.slice(1).replace('_', ' ')}</div>
                  )
                },
                {
                  key: 'acquisition_price',
                  header: 'Acquisition Price',
                  render: (deal) => (
                    <div>{formatCurrency(deal.acquisition_price)}</div>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (deal) => (
                    <Badge variant={deal.status === 'approved' ? 'success' : deal.status === 'in_review' ? 'warning' : 'default'}>
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1).replace('_', ' ')}
                    </Badge>
                  )
                },
                {
                  key: 'created_at',
                  header: 'Created',
                  render: (deal) => (
                    <div>{formatDate(deal.created_at)}</div>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  render: (deal) => (
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="transition-colors duration-200"
                        style={{
                          color: 'var(--accent)',
                          '&:hover': { color: 'var(--text-primary)' }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal
                            className="h-5 w-5 cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-dark)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {canEditDeals && (
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/deals/${deal.id}/edit`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteDeals && (
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete ${deal.project_name}?`)) {
                                  try {
                                    await deleteDeal(deal.id);
                                    showToast('Deal deleted successfully', 'success');
                                    // Refresh the deals list
                                    fetchDeals();
                                  } catch (error) {
                                    console.error(`Error deleting deal ${deal.id}:`, error);
                                    showToast('Failed to delete deal. Please try again.', 'error');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                },
              ]}
              onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
              emptyMessage="No deals found"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
