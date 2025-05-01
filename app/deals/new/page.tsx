'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createDeal } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { canCreateDeals } = usePermissions();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    project_name: '',
    location: '',
    property_type: 'office',
    acquisition_price: '',
    construction_cost: '',
    square_footage: '',
    projected_rent_per_sf: '',
    vacancy_rate: '',
    operating_expenses_per_sf: '',
    exit_cap_rate: '',
    // Property attributes
    property_class: 'Class A',
    property_style: 'Modern',
    property_subtype: 'High-rise',
    year_built: '',
    units: '',
    lot_size: '',
    zoning: 'Commercial',
    parking_spaces: '',
    acquisition_date: '',
    strategy: 'CORE PLUS',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check if user has permission to create deals
    if (!canCreateDeals) {
      showToast('You do not have permission to create deals', 'error');
      router.push('/deals');
      return;
    }
  }, [router, canCreateDeals, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = [
      'project_name',
      'location',
      'property_type',
      'acquisition_price',
      'construction_cost',
      'square_footage',
      'projected_rent_per_sf',
      'vacancy_rate',
      'operating_expenses_per_sf',
      'exit_cap_rate'
    ];

    // Check for empty required fields
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate numeric fields
    const numericFields = [
      'acquisition_price',
      'construction_cost',
      'square_footage',
      'projected_rent_per_sf',
      'vacancy_rate',
      'operating_expenses_per_sf',
      'exit_cap_rate'
    ];

    numericFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value && isNaN(Number(value))) {
        newErrors[field] = 'Must be a valid number';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert string values to numbers for numeric fields
      const dealData = {
        project_name: formData.project_name,
        location: formData.location,
        property_type: formData.property_type,
        acquisition_price: Number(formData.acquisition_price),
        construction_cost: Number(formData.construction_cost),
        square_footage: Number(formData.square_footage),
        projected_rent_per_sf: Number(formData.projected_rent_per_sf),
        vacancy_rate: Number(formData.vacancy_rate),
        operating_expenses_per_sf: Number(formData.operating_expenses_per_sf),
        exit_cap_rate: Number(formData.exit_cap_rate),
        // Property attributes
        property_class: formData.property_class,
        property_style: formData.property_style,
        property_subtype: formData.property_subtype,
        year_built: formData.year_built,
        units: formData.units ? Number(formData.units) : undefined,
        lot_size: formData.lot_size,
        zoning: formData.zoning,
        parking_spaces: formData.parking_spaces ? Number(formData.parking_spaces) : undefined,
        acquisition_date: formData.acquisition_date,
        strategy: formData.strategy
      };

      // Call the API to create a new deal
      const newDeal = await createDeal(dealData);

      // Show success message
      showToast('Deal created successfully!', 'success');

      // Redirect to the new deal page
      router.push(`/deals/${newDeal.id}`);
    } catch (error: any) {
      console.error('Error creating deal:', error);

      // Handle validation errors from the API
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'object') {
          // Handle structured validation errors
          const apiErrors: Record<string, string> = {};
          Object.entries(error.response.data.detail).forEach(([key, value]) => {
            apiErrors[key] = Array.isArray(value) ? value[0] : String(value);
          });
          setErrors(apiErrors);
          showToast('Please correct the errors in the form', 'error');
        } else {
          // Handle string error message
          showToast(`Error: ${error.response.data.detail}`, 'error');
        }
      } else {
        showToast('Failed to create deal. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create New Deal</h1>
          </div>
          <Link
            href="/deals"
            className="px-4 py-2 rounded-md transition-all duration-200"
            style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
          >
            Cancel
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="project_name" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Project Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="project_name"
                    id="project_name"
                    required
                    value={formData.project_name}
                    onChange={handleChange}
                    className={`block w-full sm:text-sm rounded-md py-1.5 px-3 ${errors.project_name ? 'border-red-300' : 'border-0'}`}
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)',
                      borderColor: errors.project_name ? 'var(--red-500)' : 'var(--border-dark)'
                    }}
                  />
                  {errors.project_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.location ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
                  Property Type
                </label>
                <div className="mt-1">
                  <select
                    id="property_type"
                    name="property_type"
                    required
                    value={formData.property_type}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.property_type ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  >
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="industrial">Industrial</option>
                    <option value="multifamily">Multifamily</option>
                    <option value="mixed_use">Mixed Use</option>
                  </select>
                  {errors.property_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.property_type}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="acquisition_price" className="block text-sm font-medium text-gray-700">
                  Acquisition Price ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="acquisition_price"
                    id="acquisition_price"
                    required
                    min="0"
                    step="1"
                    value={formData.acquisition_price}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.acquisition_price ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.acquisition_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.acquisition_price}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="construction_cost" className="block text-sm font-medium text-gray-700">
                  Construction Cost ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="construction_cost"
                    id="construction_cost"
                    required
                    min="0"
                    step="1"
                    value={formData.construction_cost}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.construction_cost ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.construction_cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.construction_cost}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="square_footage" className="block text-sm font-medium text-gray-700">
                  Square Footage
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="square_footage"
                    id="square_footage"
                    required
                    min="0"
                    step="1"
                    value={formData.square_footage}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.square_footage ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.square_footage && (
                    <p className="mt-1 text-sm text-red-600">{errors.square_footage}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="projected_rent_per_sf" className="block text-sm font-medium text-gray-700">
                  Projected Rent per SF ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="projected_rent_per_sf"
                    id="projected_rent_per_sf"
                    required
                    min="0"
                    step="0.01"
                    value={formData.projected_rent_per_sf}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.projected_rent_per_sf ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.projected_rent_per_sf && (
                    <p className="mt-1 text-sm text-red-600">{errors.projected_rent_per_sf}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="vacancy_rate" className="block text-sm font-medium text-gray-700">
                  Vacancy Rate (%)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="vacancy_rate"
                    id="vacancy_rate"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.vacancy_rate}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.vacancy_rate ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.vacancy_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.vacancy_rate}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="operating_expenses_per_sf" className="block text-sm font-medium text-gray-700">
                  Operating Expenses per SF ($)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="operating_expenses_per_sf"
                    id="operating_expenses_per_sf"
                    required
                    min="0"
                    step="0.01"
                    value={formData.operating_expenses_per_sf}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.operating_expenses_per_sf ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.operating_expenses_per_sf && (
                    <p className="mt-1 text-sm text-red-600">{errors.operating_expenses_per_sf}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="exit_cap_rate" className="block text-sm font-medium text-gray-700">
                  Exit Cap Rate (%)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="exit_cap_rate"
                    id="exit_cap_rate"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.exit_cap_rate}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${errors.exit_cap_rate ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                  />
                  {errors.exit_cap_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.exit_cap_rate}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900">Property Attributes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Additional information about the property.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="property_class" className="block text-sm font-medium text-gray-700">
                  Property Class
                </label>
                <div className="mt-1">
                  <select
                    id="property_class"
                    name="property_class"
                    value={formData.property_class}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                    <option value="Class D">Class D</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="property_style" className="block text-sm font-medium text-gray-700">
                  Property Style
                </label>
                <div className="mt-1">
                  <select
                    id="property_style"
                    name="property_style"
                    value={formData.property_style}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Modern">Modern</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Historic">Historic</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="property_subtype" className="block text-sm font-medium text-gray-700">
                  Property Subtype
                </label>
                <div className="mt-1">
                  <select
                    id="property_subtype"
                    name="property_subtype"
                    value={formData.property_subtype}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="High-rise">High-rise</option>
                    <option value="Mid-rise">Mid-rise</option>
                    <option value="Low-rise">Low-rise</option>
                    <option value="Garden-style">Garden-style</option>
                    <option value="Strip mall">Strip mall</option>
                    <option value="Power center">Power center</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Flex space">Flex space</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="year_built" className="block text-sm font-medium text-gray-700">
                  Year Built
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="year_built"
                    id="year_built"
                    value={formData.year_built}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="units" className="block text-sm font-medium text-gray-700">
                  Units
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="units"
                    id="units"
                    min="0"
                    value={formData.units}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lot_size" className="block text-sm font-medium text-gray-700">
                  Lot Size
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lot_size"
                    id="lot_size"
                    value={formData.lot_size}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g. 2.5 acres"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="zoning" className="block text-sm font-medium text-gray-700">
                  Zoning
                </label>
                <div className="mt-1">
                  <select
                    id="zoning"
                    name="zoning"
                    value={formData.zoning}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Mixed-use">Mixed-use</option>
                    <option value="Special purpose">Special purpose</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="parking_spaces" className="block text-sm font-medium text-gray-700">
                  Parking Spaces
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="parking_spaces"
                    id="parking_spaces"
                    min="0"
                    value={formData.parking_spaces}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="acquisition_date" className="block text-sm font-medium text-gray-700">
                  Acquisition Date
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="acquisition_date"
                    id="acquisition_date"
                    value={formData.acquisition_date}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g. Jan 15, 2023"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">
                  Investment Strategy
                </label>
                <div className="mt-1">
                  <select
                    id="strategy"
                    name="strategy"
                    value={formData.strategy}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="CORE">CORE</option>
                    <option value="CORE PLUS">CORE PLUS</option>
                    <option value="VALUE ADD">VALUE ADD</option>
                    <option value="OPPORTUNISTIC">OPPORTUNISTIC</option>
                    <option value="DEVELOPMENT">DEVELOPMENT</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/deals"
                className="px-4 py-2 rounded-md transition-all duration-200 mr-3"
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
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
