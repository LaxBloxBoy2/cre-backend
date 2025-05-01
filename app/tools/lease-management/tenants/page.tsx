'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useToast } from '@/app/contexts/ToastContext';
import LeaseNavTabs from '@/app/components/lease-management/LeaseNavTabs';
import {
  Users,
  Plus,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  getAllLeases,
  getAllTenants,
  Lease,
  mockLeases
} from '@/app/lib/mock-leases';
import NewTenantForm from '@/app/components/lease-management/NewTenantForm';

export default function TenantsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // State for tenants and leases
  const [tenants, setTenants] = useState<any[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);

  // Load tenants and leases on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all tenants and leases
  const loadData = async () => {
    try {
      const allTenants = getAllTenants();
      const allLeases = mockLeases;

      setTenants(allTenants);
      setLeases(allLeases);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load tenant data. Please try again.',
        variant: 'error'
      });
    }
  };

  // Handle delete tenant
  const handleDeleteTenant = (id: string) => {
    if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        // Filter out the tenant to delete
        const updatedTenants = tenants.filter(tenant => tenant.id !== id);
        setTenants(updatedTenants);

        // In a real app, you would call an API here
        // For now, we'll just show a success message
        showToast({
          title: 'Success',
          description: 'Tenant deleted successfully',
          variant: 'success'
        });
      } catch (error) {
        console.error('Error deleting tenant:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete tenant. Please try again.',
          variant: 'error'
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Tenants</h1>
        <Button
          className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
          onClick={() => setIsNewTenantModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Tenant
        </Button>
      </div>

      <LeaseNavTabs />

      {/* New Tenant Modal */}
      <NewTenantForm
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onSuccess={loadData}
      />

      <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-black dark:text-white">All Tenants</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Manage your tenants</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No tenants found</p>
              <Button className="mt-2 bg-[#00F0B4] hover:bg-[#00D0A0] text-black" onClick={() => setIsNewTenantModalOpen(true)}>
                Add Your First Tenant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 font-medium text-sm border-b border-gray-200 dark:border-[#2F374A] pb-2 text-gray-700 dark:text-gray-300">
                <div>Tenant</div>
                <div>Contact</div>
                <div>Industry</div>
                <div>Credit Rating</div>
                <div>Payment History</div>
                <div className="text-center">Actions</div>
              </div>

              {tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="grid grid-cols-6 gap-4 items-center border-b border-gray-200 dark:border-[#2F374A] pb-4 hover:bg-gray-50 dark:hover:bg-[#22272E] cursor-pointer"
                  onClick={() => router.push(`/tools/lease-management/tenants/${tenant.id}`)}
                >
                  <div>
                    <p className="font-medium text-black dark:text-white">{tenant.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {leases.filter(l => l.tenantId === tenant.id && l.status === 'Active').length} active leases
                    </p>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p>{tenant.contactName}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{tenant.contactEmail}</span>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{tenant.contactPhone}</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]">
                      {tenant.industry || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Badge
                      className={
                        tenant.creditRating?.startsWith('A') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                        tenant.creditRating?.startsWith('B') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                      }
                    >
                      {tenant.creditRating || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Badge
                      className={
                        tenant.paymentHistory === 'Excellent' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                        tenant.paymentHistory === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                        tenant.paymentHistory === 'Fair' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                      }
                    >
                      {tenant.paymentHistory}
                    </Badge>
                  </div>
                  <div className="flex justify-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tools/lease-management/tenants/${tenant.id}`);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality would go here
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTenant(tenant.id);
                      }}
                      className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
