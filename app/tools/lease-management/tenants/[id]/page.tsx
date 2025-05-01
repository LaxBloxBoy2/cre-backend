'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building, DollarSign, Edit, Mail, Phone, User, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLeases, Lease, saveTenant, getTenantById } from '@/lib/mock-leases';
import { CommunicationRecord, SatisfactionRecord, Tenant } from '@/lib/mock-leases';
import { CommunicationHistory } from '@/components/tenant/CommunicationHistory';
import { SatisfactionTracking } from '@/components/tenant/SatisfactionTracking';
import { EditTenantForm } from '@/components/tenant/EditTenantForm';
import { EditCompanyInfoForm } from '@/components/tenant/EditCompanyInfoForm';
import { EditFinancialInfoForm } from '@/components/tenant/EditFinancialInfoForm';
import { CustomFieldsManager } from '@/components/tenant/CustomFieldsManager';
import { updateTenant as apiUpdateTenant } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import LeaseNavTabs from '@/components/lease-management/LeaseNavTabs';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isCompanyInfoFormOpen, setIsCompanyInfoFormOpen] = useState(false);
  const [isFinancialInfoFormOpen, setIsFinancialInfoFormOpen] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const { showToast } = useToast();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const tenantId = params.id as string;

        // Get the tenant by ID
        const foundTenant = getTenantById(tenantId);

        if (foundTenant) {
          setTenant(foundTenant);
        } else {
          // If not found, show error
          showToast({
            description: "Tenant not found",
            variant: "error"
          });
        }

        // Find leases for this tenant
        const leases = mockLeases.filter(lease => lease.tenantId === tenantId);
        setTenantLeases(leases);
      } catch (error) {
        console.error("Error fetching tenant:", error);

        // Show error message
        showToast({
          description: "Failed to load tenant data",
          variant: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();

    // Add event listener for tenant updates
    const handleTenantUpdated = (event: CustomEvent) => {
      const updatedTenant = event.detail;
      if (updatedTenant && updatedTenant.id === params.id) {
        setTenant(updatedTenant);
        setRefreshCounter(prev => prev + 1);
      }
    };

    window.addEventListener('tenant-updated', handleTenantUpdated as EventListener);

    return () => {
      window.removeEventListener('tenant-updated', handleTenantUpdated as EventListener);
    };
  }, [params.id, showToast]);

  const handleSaveTenant = async (updatedTenant: Tenant) => {
    try {
      // Save the tenant to localStorage
      saveTenant(updatedTenant);

      // Also update via the API
      await apiUpdateTenant(updatedTenant.id, updatedTenant);

      // Update the local state
      setTenant(updatedTenant);

      // Show success message
      showToast({
        description: "Tenant updated successfully",
        variant: "success"
      });

      // Close the form
      setIsEditFormOpen(false);
    } catch (error) {
      console.error("Error updating tenant:", error);

      // Even if the API call fails, we've already saved to localStorage
      // Show success message
      showToast({
        description: "Tenant updated in local storage",
        variant: "success"
      });

      // Close the form
      setIsEditFormOpen(false);
    }
  };

  const handleAddCommunication = async (record: CommunicationRecord) => {
    if (!tenant) return;

    try {
      // Create updated tenant object
      const updatedTenant = {
        ...tenant,
        communicationHistory: [
          record,
          ...(tenant.communicationHistory || [])
        ]
      };

      // Save the tenant to localStorage
      saveTenant(updatedTenant);

      // Also update via the API
      await apiUpdateTenant(tenant.id, updatedTenant);

      // Update the local state
      setTenant(updatedTenant);

      // Show success message
      showToast({
        description: "Communication record added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error("Error adding communication record:", error);

      // Show success message since we've already saved to localStorage
      showToast({
        description: "Communication record added to local storage",
        variant: "success"
      });
    }
  };

  const handleAddSatisfaction = async (record: SatisfactionRecord) => {
    if (!tenant) return;

    try {
      // Create updated tenant object
      const updatedTenant = {
        ...tenant,
        satisfactionHistory: [
          record,
          ...(tenant.satisfactionHistory || [])
        ]
      };

      // Recalculate average satisfaction rating
      const allRatings = updatedTenant.satisfactionHistory.map(r => r.rating);
      const avgRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;

      updatedTenant.satisfactionRating = avgRating;

      // Save the tenant to localStorage
      saveTenant(updatedTenant);

      // Also update via the API
      await apiUpdateTenant(tenant.id, updatedTenant);

      // Update the local state
      setTenant(updatedTenant);

      // Show success message
      showToast({
        description: "Satisfaction record added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error("Error adding satisfaction record:", error);

      // Show success message since we've already saved to localStorage
      showToast({
        description: "Satisfaction record added to local storage",
        variant: "success"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tenant) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-black dark:text-white">Tenant not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">The tenant you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.push('/tools/lease-management/tenants')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <h1 className="text-2xl font-bold text-black dark:text-white">{tenant.name}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditFormOpen(true)}
          className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Tenant
        </Button>
      </div>

      <LeaseNavTabs />

      {/* Edit Tenant Form */}
      {tenant && (
        <EditTenantForm
          tenant={tenant}
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSave={handleSaveTenant}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-black dark:text-white">Contact Information</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompanyInfoFormOpen(true)}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-black dark:text-white">{tenant.contactName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Primary Contact</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-black dark:text-white">{tenant.contactEmail}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-black dark:text-white">{tenant.contactPhone}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              </div>
            </div>
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-black dark:text-white">{tenant.address || 'N/A'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tenant.city && tenant.state ? `${tenant.city}, ${tenant.state} ${tenant.zipCode || ''}` : 'Address not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-black dark:text-white">Financial Information</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFinancialInfoFormOpen(true)}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  {tenant.annualRevenue ? `$${(tenant.annualRevenue / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Annual Revenue</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Credit Rating</p>
                <p className="font-medium text-black dark:text-white">{tenant.creditRating || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment History</p>
                <p className="font-medium text-black dark:text-white">{tenant.paymentHistory}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Year Founded</p>
                <p className="font-medium text-black dark:text-white">{tenant.yearFounded || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company Size</p>
                <p className="font-medium text-black dark:text-white">{tenant.companySize || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Tracking */}
      <div className="mb-6">
        <SatisfactionTracking
          tenant={tenant}
          onAddSatisfaction={handleAddSatisfaction}
        />
      </div>

      {/* Communication History */}
      <div className="mb-6">
        <CommunicationHistory
          tenant={tenant}
          onAddCommunication={handleAddCommunication}
        />
      </div>

      {/* Tenant Leases */}
      <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-black dark:text-white">Tenant Leases</CardTitle>
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {tenantLeases.filter(l => l.status === 'Active').length} Active Leases
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tenantLeases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Building className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No leases found for this tenant</p>
              <Button className="mt-4 bg-[#00F0B4] hover:bg-[#00D0A0] text-black" onClick={() => router.push('/tools/lease-management/leases')}>
                Add New Lease
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tenantLeases.map(lease => (
                <div
                  key={lease.id}
                  className="p-4 border border-gray-200 dark:border-[#2F374A] rounded-lg hover:bg-gray-50 dark:hover:bg-[#22272E] cursor-pointer"
                  onClick={() => router.push(`/tools/lease-management/${lease.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-black dark:text-white">{lease.assetName}</h3>
                      <Badge variant="outline" className="mt-1 bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]">
                        {lease.leaseType}
                      </Badge>
                    </div>
                    <Badge
                      className={
                        lease.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                        lease.status === 'Expired' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                      }
                    >
                      {lease.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lease Term</p>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Area</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{lease.leaseArea.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Rent</p>
                      <p className="text-sm font-medium text-black dark:text-white">{formatCurrency(lease.baseRent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Rent per sq ft</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">${Math.round((lease.baseRent * 12) / lease.leaseArea)}/sqft/yr</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tools/lease-management/${lease.id}`);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] mb-6">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0F1117] rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Monthly Rent</h3>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(tenantLeases.filter(l => l.status === 'Active').reduce((sum, lease) => sum + lease.baseRent, 0))}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0F1117] rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Leased Area</h3>
              <p className="text-2xl font-bold text-blue-500">
                {tenantLeases.filter(l => l.status === 'Active').reduce((sum, lease) => sum + lease.leaseArea, 0).toLocaleString()} sq ft
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0F1117] rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Rent per sq ft</h3>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(
                  tenantLeases.filter(l => l.status === 'Active').length > 0 ?
                  tenantLeases.filter(l => l.status === 'Active').reduce((sum, lease) => sum + ((lease.baseRent * 12) / lease.leaseArea), 0) /
                  tenantLeases.filter(l => l.status === 'Active').length : 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <div className="mb-6">
        <CustomFieldsManager
          tenant={tenant}
          onSave={handleSaveTenant}
        />
      </div>

      {/* Edit Forms */}
      {tenant && (
        <>
          <EditCompanyInfoForm
            tenant={tenant}
            isOpen={isCompanyInfoFormOpen}
            onClose={() => setIsCompanyInfoFormOpen(false)}
            onSave={handleSaveTenant}
          />

          <EditFinancialInfoForm
            tenant={tenant}
            isOpen={isFinancialInfoFormOpen}
            onClose={() => setIsFinancialInfoFormOpen(false)}
            onSave={handleSaveTenant}
          />
        </>
      )}
    </div>
  );
}
