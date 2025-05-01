'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getDeal, updateDeal } from '../../../lib/api';
import { useToast } from '../../../contexts/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';

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

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { canEditDeals } = usePermissions();
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<Deal>>({});

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check if user has permission to edit deals
    if (!canEditDeals) {
      showToast('You do not have permission to edit deals', 'error');
      router.push(`/deals/${params.id}`);
      return;
    }

    const fetchDealData = async () => {
      try {
        setLoading(true);
        const dealData = await getDeal(params.id as string);
        setDeal(dealData);
        setFormData(dealData);
      } catch (error) {
        console.error('Error fetching deal:', error);
        showToast('Failed to load deal data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [router, params.id, showToast, canEditDeals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Convert numeric values
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deal) return;

    try {
      setSaving(true);
      console.log('Form data before processing:', formData);

      // Make sure all numeric fields are properly converted to numbers
      const numericFields = [
        'acquisition_price', 'construction_cost', 'square_footage',
        'projected_rent_per_sf', 'vacancy_rate', 'operating_expenses_per_sf',
        'exit_cap_rate', 'units', 'parking_spaces'
      ];

      const processedFormData = { ...formData };

      // Convert numeric fields to numbers
      for (const field of numericFields) {
        if (field in processedFormData && processedFormData[field] !== '') {
          processedFormData[field] = Number(processedFormData[field]);
        }
      }

      console.log('Processed form data:', processedFormData);
      console.log('Calling updateDeal with id:', deal.id);

      // Call the API to update the deal
      const updatedDeal = await updateDeal(deal.id, processedFormData);
      console.log('Received updated deal:', updatedDeal);

      // Update the local deal state with the response
      setDeal(updatedDeal);

      // Update the local storage to persist the changes for demo mode
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token === 'demo_access_token') {
          try {
            // Store the updated deal in localStorage for demo persistence
            localStorage.setItem(`demo_deal_${deal.id}`, JSON.stringify(updatedDeal));
            console.log('Saved updated deal to localStorage for demo persistence');
          } catch (e) {
            console.warn('Failed to save updated deal to localStorage:', e);
          }
        }
      }

      showToast('Deal updated successfully', 'success');
      router.push(`/deals/${deal.id}`);
    } catch (error) {
      console.error('Error updating deal:', error);
      showToast('Failed to update deal. Please try again.', 'error');
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Deal: {deal.project_name}</h1>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link
              href={`/deals/${deal.id}`}
              className="px-4 py-2 rounded-md transition-all duration-200"
              style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="project_name" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="project_name"
                    id="project_name"
                    value={formData.project_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="property_type" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Property Type
                  </label>
                  <select
                    name="property_type"
                    id="property_type"
                    value={formData.property_type || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  >
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="industrial">Industrial</option>
                    <option value="multifamily">Multifamily</option>
                    <option value="mixed_use">Mixed Use</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="land">Land</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="property_class" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Property Class
                  </label>
                  <select
                    name="property_class"
                    id="property_class"
                    value={formData.property_class || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                  >
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                    <option value="Class D">Class D</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="year_built" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Year Built
                  </label>
                  <input
                    type="text"
                    name="year_built"
                    id="year_built"
                    value={formData.year_built || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="units" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Units
                  </label>
                  <input
                    type="number"
                    name="units"
                    id="units"
                    value={formData.units || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="acquisition_price" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Acquisition Price ($)
                  </label>
                  <input
                    type="number"
                    name="acquisition_price"
                    id="acquisition_price"
                    value={formData.acquisition_price || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="construction_cost" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Construction Cost ($)
                  </label>
                  <input
                    type="number"
                    name="construction_cost"
                    id="construction_cost"
                    value={formData.construction_cost || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="square_footage" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Square Footage
                  </label>
                  <input
                    type="number"
                    name="square_footage"
                    id="square_footage"
                    value={formData.square_footage || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="projected_rent_per_sf" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Projected Rent per SF ($)
                  </label>
                  <input
                    type="number"
                    name="projected_rent_per_sf"
                    id="projected_rent_per_sf"
                    value={formData.projected_rent_per_sf || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vacancy_rate" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Vacancy Rate (%)
                  </label>
                  <input
                    type="number"
                    name="vacancy_rate"
                    id="vacancy_rate"
                    value={formData.vacancy_rate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="operating_expenses_per_sf" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Operating Expenses per SF ($)
                  </label>
                  <input
                    type="number"
                    name="operating_expenses_per_sf"
                    id="operating_expenses_per_sf"
                    value={formData.operating_expenses_per_sf || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="exit_cap_rate" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Exit Cap Rate (%)
                  </label>
                  <input
                    type="number"
                    name="exit_cap_rate"
                    id="exit_cap_rate"
                    value={formData.exit_cap_rate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="strategy" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Investment Strategy
                  </label>
                  <select
                    name="strategy"
                    id="strategy"
                    value={formData.strategy || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 px-3"
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-dark)'
                    }}
                  >
                    <option value="CORE">Core</option>
                    <option value="CORE PLUS">Core Plus</option>
                    <option value="VALUE ADD">Value Add</option>
                    <option value="OPPORTUNISTIC">Opportunistic</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 text-right sm:px-6 border-t" style={{ borderColor: 'var(--border-dark)' }}>
              <Link
                href={`/deals/${deal.id}`}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md mr-3"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border-dark)'
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200"
              >
                {saving ? 'Saving...' : 'Save Deal'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
