'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import LeaseNavTabs from '@/app/components/lease-management/LeaseNavTabs';
import { useToast } from '@/app/contexts/ToastContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Download,
  CheckSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  getAllLeases,
  updateLeaseStatus,
  Lease,
  mockLeases,
  deleteLease as mockDeleteLease
} from '@/app/lib/mock-leases';
import { deleteLease as apiDeleteLease } from '@/app/lib/api';
import { formatCurrency } from '@/app/lib/utils/format';

export default function LeasesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLeases, setSelectedLeases] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadLeases();
  }, []);

  const loadLeases = async () => {
    try {
      // Use the mock data directly from the imported mockLeases
      const allLeases = mockLeases;

      // Update status of each lease based on current date
      const updatedLeases = allLeases.map(lease => updateLeaseStatus(lease));

      setLeases(updatedLeases);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leases:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load lease data. Please try again.',
        variant: 'error'
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const filteredLeases = leases.filter(lease => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lease.assetName.toLowerCase().includes(searchLower) ||
      lease.tenantName.toLowerCase().includes(searchLower) ||
      lease.leaseType.toLowerCase().includes(searchLower)
    );
  });

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
      setSelectedLeases(filteredLeases.map(lease => lease.id));
      setSelectAll(true);
    } else {
      setSelectedLeases([]);
      setSelectAll(false);
    }
  };

  // Handle bulk actions
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
          onClick={() => router.push('/tools/lease-management/create')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Lease
        </Button>
      </div>

      <LeaseNavTabs />

      <div className="bg-white dark:bg-[#1A1D23] rounded-lg shadow-sm border border-gray-200 dark:border-[#2F374A]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white">All Leases</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your property leases</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search leases..."
                  className="pl-8 bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
                onClick={() => router.push('/tools/lease-management/create')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Lease
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedLeases.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-[#22272E] border border-gray-200 dark:border-[#2F374A] rounded-md flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedLeases.length}</span> lease(s) selected
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                  onClick={() => setSelectedLeases([])}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] text-red-600 dark:text-red-400"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : filteredLeases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No leases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2F374A]">
                    <th className="text-left py-2 px-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-[#00F0B4] data-[state=checked]:text-black"
                      />
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Property / Tenant</th>
                    <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Term</th>
                    <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Monthly Rent</th>
                    <th className="text-right py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeases.map((lease) => {
                    // Calculate lease term dates for display
                    const startDate = new Date(lease.startDate);
                    const endDate = new Date(lease.endDate);

                    return (
                      <tr
                        key={lease.id}
                        className={`border-b border-gray-200 dark:border-[#2F374A] hover:bg-gray-50 dark:hover:bg-[#22272E] cursor-pointer ${
                          selectedLeases.includes(lease.id) ? 'bg-gray-50 dark:bg-[#22272E]' : ''
                        }`}
                        onClick={() => router.push(`/tools/lease-management/${lease.id}`)}
                      >
                        <td className="py-3 px-2 text-gray-700 dark:text-gray-300" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeases.includes(lease.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLeases(prev => [...prev, lease.id]);
                              } else {
                                setSelectedLeases(prev => prev.filter(id => id !== lease.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-[#00F0B4] data-[state=checked]:text-black"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-black dark:text-white">{lease.assetName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{lease.tenantName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2F374A]">
                            {lease.leaseType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-black dark:text-white">
                              {format(startDate, 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(endDate, 'MMM d, yyyy')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-medium text-black dark:text-white">{formatCurrency(lease.baseRent)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ${(lease.baseRent * 12 / lease.leaseArea).toFixed(2)} /sqft/yr
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/tools/lease-management/${lease.id}`);
                              }}
                            >
                              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/tools/lease-management/${lease.id}/edit`);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLease(lease.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
