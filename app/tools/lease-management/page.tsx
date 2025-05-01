'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs-shadcn';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Checkbox } from '../../components/ui/checkbox';
import LeaseNavTabs from '../../components/lease-management/LeaseNavTabs';
import { useToast } from '../../contexts/ToastContext';
import {
  Calendar,
  Building,
  Users,
  FileText,
  AlertTriangle,
  DollarSign,
  BarChart2,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  getAllLeases,
  getAllTenants,
  updateLeaseStatus,
  calculateRentForDate,
  Lease,
  getLeases,
  getTenants,
  getLeaseAnalytics,
  deleteLease as mockDeleteLease,
  saveLease,
  mockLeases
} from '../../lib/mock-leases';
import { deleteLease as apiDeleteLease, updateLease } from '../../lib/api'; // This is the correct updateLease from api.ts

// Import the form components
import NewLeaseForm from '../../components/lease-management/NewLeaseForm';
import EditLeaseForm from '../../components/lease-management/EditLeaseForm';
import NewTenantForm from '../../components/lease-management/NewTenantForm';
import InlineLeaseEditor from '../../components/lease-management/InlineLeaseEditor';

export default function LeaseManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // State for leases and tenants
  const [leases, setLeases] = useState<Lease[]>([]);
  const [upcomingExpirations, setUpcomingExpirations] = useState<Lease[]>([]);
  const [totalMonthlyRent, setTotalMonthlyRent] = useState<number>(0);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);

  // State for modal forms
  const [isNewLeaseModalOpen, setIsNewLeaseModalOpen] = useState(false);
  const [isEditLeaseModalOpen, setIsEditLeaseModalOpen] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  // State for inline editing
  const [editingLeaseId, setEditingLeaseId] = useState<string | null>(null);

  // State for lease selection
  const [selectedLeases, setSelectedLeases] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Mock assets for demo
  const [assets, setAssets] = useState([
    { id: 'asset1', name: 'Office Building A' },
    { id: 'asset2', name: 'Retail Center B' },
    { id: 'asset3', name: 'Industrial Park C' }
  ]);

  // Load leases and calculate metrics on component mount
  useEffect(() => {
    loadLeases();
  }, []);

  // Load all leases and update their status
  const loadLeases = async () => {
    try {
      console.log("Loading leases...");

      // Use the mock data directly from the imported mockLeases
      const allLeases = mockLeases;
      console.log("Mock leases loaded:", allLeases.length);

      // Update status of each lease based on current date
      const updatedLeases = allLeases.map(lease => updateLeaseStatus(lease));
      console.log("Updated leases:", updatedLeases.length);

      // Calculate upcoming expirations (within next 6 months)
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const upcoming = updatedLeases.filter(lease => {
        const endDate = new Date(lease.endDate);
        const now = new Date();
        return lease.status === 'Active' && endDate > now && endDate <= sixMonthsFromNow;
      }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      console.log("Upcoming expirations:", upcoming.length);

      // Calculate total monthly rent
      const now = new Date();
      const activeLeases = updatedLeases.filter(lease => lease.status === 'Active');
      console.log("Active leases:", activeLeases.length);

      const totalRent = activeLeases.reduce((sum, lease) => sum + calculateRentForDate(lease, now), 0);
      console.log("Total monthly rent:", totalRent);

      // Calculate occupancy rate (active leases / total leases)
      const occupancy = activeLeases.length / (updatedLeases.length || 1) * 100;
      console.log("Occupancy rate:", occupancy);

      setLeases(updatedLeases);
      setUpcomingExpirations(upcoming);
      setTotalMonthlyRent(totalRent);
      setOccupancyRate(occupancy);
    } catch (error) {
      console.error('Error loading leases:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load lease data. Please try again.',
        variant: 'error'
      });
    }
  };

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

  // Calculate days until expiration
  const getDaysUntilExpiration = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get badge variant based on days until expiration
  const getExpirationBadgeVariant = (days: number): "default" | "destructive" | "outline" | "secondary" => {
    if (days <= 30) return 'destructive';
    if (days <= 90) return 'secondary';
    return 'outline';
  };

  // Handle edit lease (modal)
  const handleEditLease = (lease: Lease) => {
    setSelectedLease(lease);
    setIsEditLeaseModalOpen(true);
  };

  // Handle inline edit
  const handleInlineEdit = (leaseId: string) => {
    setEditingLeaseId(leaseId);
  };

  // Handle save inline edit
  const handleSaveInlineEdit = async (updatedLease: Lease) => {
    try {
      // Save to local storage
      saveLease(updatedLease);

      // Also try to update via API
      try {
        // Convert to API format
        const apiLeaseData = {
          asset_id: updatedLease.assetId,
          tenant_id: updatedLease.tenantId,
          lease_type: updatedLease.leaseType,
          start_date: updatedLease.startDate,
          end_date: updatedLease.endDate,
          base_rent: updatedLease.baseRent,
          rent_escalation: updatedLease.rentEscalation,
          security_deposit: updatedLease.securityDeposit,
          lease_area: updatedLease.leaseArea,
          status: updatedLease.status,
          notes: updatedLease.notes
        };

        await updateLease(updatedLease.id, apiLeaseData);
      } catch (apiError) {
        console.error('API call failed, but local update succeeded:', apiError);
      }

      showToast({
        title: 'Success',
        description: 'Lease updated successfully',
        variant: 'success'
      });

      // Refresh leases and exit edit mode
      loadLeases();
      setEditingLeaseId(null);
    } catch (error) {
      console.error('Error updating lease:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update lease. Please try again.',
        variant: 'error'
      });
    }
  };

  // Handle cancel inline edit
  const handleCancelInlineEdit = () => {
    setEditingLeaseId(null);
  };

  // Handle delete lease
  const handleDeleteLease = async (id: string) => {
    if (confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
      try {
        // Delete from local storage
        mockDeleteLease(id);

        // Also try to delete via API
        try {
          await apiDeleteLease(id);
        } catch (apiError) {
          console.error('API call failed, but local delete succeeded:', apiError);
        }

        showToast({
          title: 'Success',
          description: 'Lease deleted successfully',
          variant: 'success'
        });
        loadLeases();

        // If we were editing this lease, exit edit mode
        if (editingLeaseId === id) {
          setEditingLeaseId(null);
        }

        // Remove from selected leases if it was selected
        if (selectedLeases.includes(id)) {
          setSelectedLeases(prev => prev.filter(leaseId => leaseId !== id));
        }
      } catch (error) {
        console.error('Error deleting lease:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete lease. Please try again.',
          variant: 'error'
        });
      }
    }
  };

  // Handle selecting/deselecting a single lease
  const handleSelectLease = (e: React.MouseEvent, leaseId: string) => {
    e.stopPropagation(); // Prevent row click from navigating

    setSelectedLeases(prev => {
      if (prev.includes(leaseId)) {
        return prev.filter(id => id !== leaseId);
      } else {
        return [...prev, leaseId];
      }
    });
  };

  // Handle selecting/deselecting all leases
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeases(leases.map(lease => lease.id));
      setSelectAll(true);
    } else {
      setSelectedLeases([]);
      setSelectAll(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedLeases.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedLeases.length} selected lease(s)? This action cannot be undone.`)) {
      try {
        // Delete each selected lease
        selectedLeases.forEach(id => {
          mockDeleteLease(id);
          try {
            apiDeleteLease(id);
          } catch (apiError) {
            console.error('API call failed for lease ID:', id, apiError);
          }
        });

        showToast({
          title: 'Success',
          description: `${selectedLeases.length} lease(s) deleted successfully`,
          variant: 'success'
        });

        // Reset selection and reload leases
        setSelectedLeases([]);
        setSelectAll(false);
        loadLeases();
      } catch (error) {
        console.error('Error deleting leases:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete some leases. Please try again.',
          variant: 'error'
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Leases</h1>
        <Button
          className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
          onClick={() => setIsNewLeaseModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Lease
        </Button>
      </div>

      <LeaseNavTabs />

      {/* New Lease Modal */}
      <NewLeaseForm
        isOpen={isNewLeaseModalOpen}
        onClose={() => setIsNewLeaseModalOpen(false)}
        onSuccess={loadLeases}
        assets={assets}
      />

      {/* Edit Lease Modal */}
      <EditLeaseForm
        isOpen={isEditLeaseModalOpen}
        onClose={() => setIsEditLeaseModalOpen(false)}
        onSuccess={loadLeases}
        lease={selectedLease}
        assets={assets}
      />

      {/* New Tenant Modal */}
      <NewTenantForm
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onSuccess={loadLeases}
      />

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lease Expirations Card */}
            <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-black dark:text-white">Lease Expirations</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Upcoming lease expirations</CardDescription>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${upcomingExpirations.length > 0 ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
              </CardHeader>
              <CardContent>
                {upcomingExpirations.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingExpirations.slice(0, 5).map(lease => {
                      const daysUntil = getDaysUntilExpiration(lease.endDate);
                      return (
                        <div key={lease.id} className="flex items-center justify-between border-b border-gray-200 dark:border-[#2F374A] pb-2">
                          <div>
                            <p className="font-medium text-black dark:text-white">{lease.assetName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lease.tenantName}</p>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{formatDate(lease.endDate)}</span>
                            </div>
                          </div>
                          <Badge variant={getExpirationBadgeVariant(daysUntil)} className="bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]">
                            {daysUntil} days
                          </Badge>
                        </div>
                      );
                    })}

                    {upcomingExpirations.length > 5 && (
                      <Button variant="link" className="w-full text-sm text-blue-600 dark:text-blue-400" onClick={() => router.push('/tools/lease-management/leases')}>
                        View {upcomingExpirations.length - 5} more
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No upcoming expirations in the next 6 months</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rent Overview Card */}
            <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-black dark:text-white">Rent Overview</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Monthly rent collection</CardDescription>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-3xl font-bold text-green-500">{formatCurrency(totalMonthlyRent)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Monthly Rent</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Active Leases</span>
                      <span className="font-medium text-black dark:text-white">{leases.filter(l => l.status === 'Active').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Avg. Rent per Sq Ft</span>
                      <span className="font-medium text-black dark:text-white">
                        {formatCurrency(
                          leases.filter(l => l.status === 'Active').reduce((sum, lease) => sum + ((lease.baseRent * 12) / lease.leaseArea), 0) /
                          (leases.filter(l => l.status === 'Active').length || 1)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Avg. Lease Term</span>
                      <span className="font-medium text-black dark:text-white">
                        {Math.round(
                          leases.filter(l => l.status === 'Active').reduce((sum, lease) => {
                            const start = new Date(lease.startDate);
                            const end = new Date(lease.endDate);
                            return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                          }, 0) /
                          (leases.filter(l => l.status === 'Active').length || 1)
                        )} months
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Rate Card */}
            <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-black dark:text-white">Occupancy Rate</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Current portfolio occupancy</CardDescription>
                  </div>
                  <Building className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative h-32 w-32">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-3xl font-bold text-black dark:text-white">{Math.round(occupancyRate)}%</p>
                      </div>
                      <svg className="h-32 w-32" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-300 dark:text-gray-600 stroke-current"
                          strokeWidth="10"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-blue-500 stroke-current"
                          strokeWidth="10"
                          strokeLinecap="round"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                          strokeDasharray={`${occupancyRate * 2.51} 251.2`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Active Leases</span>
                      <span className="font-medium text-black dark:text-white">{leases.filter(l => l.status === 'Active').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Expired Leases</span>
                      <span className="font-medium text-black dark:text-white">{leases.filter(l => l.status === 'Expired').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Upcoming Leases</span>
                      <span className="font-medium text-black dark:text-white">{leases.filter(l => l.status === 'Upcoming').length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
