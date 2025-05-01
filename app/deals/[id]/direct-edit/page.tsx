'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../../contexts/ToastContext';

export default function DirectEditPage() {
  const router = useRouter();
  const params = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    // Load deal data
    const loadDeal = () => {
      setLoading(true);
      
      // Try to get from localStorage first
      const storedDeal = localStorage.getItem(`demo_deal_${params.id}`);
      if (storedDeal) {
        try {
          const parsedDeal = JSON.parse(storedDeal);
          setDeal(parsedDeal);
          setFormData(parsedDeal);
          console.log('Loaded deal from localStorage:', parsedDeal);
        } catch (e) {
          console.warn('Failed to parse stored deal:', e);
          showToast('Failed to load deal data', 'error');
        }
      } else {
        // No stored deal, try to get from the page
        showToast('No stored deal found. Please go back to the deal page first.', 'warning');
      }
      
      setLoading(false);
    };
    
    loadDeal();
  }, [params.id, showToast]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle numeric fields
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      console.log('Saving form data:', formData);
      
      // Process numeric fields
      const numericFields = [
        'acquisition_price', 'construction_cost', 'square_footage',
        'projected_rent_per_sf', 'vacancy_rate', 'operating_expenses_per_sf',
        'exit_cap_rate', 'units', 'parking_spaces'
      ];
      
      const processedData = { ...formData };
      
      // Ensure numeric fields are numbers
      for (const field of numericFields) {
        if (field in processedData && processedData[field] !== '') {
          processedData[field] = Number(processedData[field]);
        }
      }
      
      // Add updated timestamp
      processedData.updated_at = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(`demo_deal_${params.id}`, JSON.stringify(processedData));
      
      showToast('Deal updated successfully', 'success');
      
      // Navigate back to deal page
      router.push(`/deals/${params.id}`);
    } catch (error) {
      console.error('Error saving deal:', error);
      showToast('Failed to save deal. Please try again.', 'error');
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
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Please go back to the deal page first to load the deal data.</p>
          <Link
            href={`/deals/${params.id}`}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105"
          >
            Back to Deal
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
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Direct Edit: {formData.project_name}</h1>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link
              href={`/deals/${params.id}`}
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
              </div>
            </div>
            <div className="px-4 py-3 text-right sm:px-6 border-t" style={{ borderColor: 'var(--border-dark)' }}>
              <Link
                href={`/deals/${params.id}`}
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
