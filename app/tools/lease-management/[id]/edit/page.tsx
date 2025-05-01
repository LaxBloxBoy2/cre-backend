'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar as CalendarIcon, Building, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { cn } from '@/app/lib/utils';
import {
  getLeaseById,
  getAllTenants,
  saveLease,
  Lease,
  Tenant
} from '@/app/lib/mock-leases';
import { updateLease } from '@/app/lib/api'; // This is the correct updateLease from api.ts

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lease, setLease] = useState<Lease | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    asset_id: '',
    tenant_id: '',
    lease_type: 'Office',
    start_date: new Date(),
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
    base_rent: 0,
    rent_escalation: 0,
    security_deposit: 0,
    lease_area: 0,
    status: 'Upcoming',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get lease data
        const leaseId = params.id as string;
        const leaseData = getLeaseById(leaseId);

        if (!leaseData) {
          showToast({
            title: 'Error',
            description: 'Lease not found',
            variant: 'destructive'
          });
          router.push('/tools/lease-management');
          return;
        }

        setLease(leaseData);

        // Get tenants
        const tenantsData = getAllTenants();
        setTenants(tenantsData);

        // In a real app, we would fetch assets from the API
        // For now, we'll just use the current asset
        setAssets([{
          id: leaseData.assetId,
          name: leaseData.assetName
        }]);

        // Set form data
        setFormData({
          asset_id: leaseData.assetId,
          tenant_id: leaseData.tenantId,
          lease_type: leaseData.leaseType,
          start_date: new Date(leaseData.startDate),
          end_date: new Date(leaseData.endDate),
          base_rent: leaseData.baseRent,
          rent_escalation: leaseData.rentEscalation,
          security_deposit: leaseData.securityDeposit,
          lease_area: leaseData.leaseArea,
          status: leaseData.status,
          notes: leaseData.notes
        });
      } catch (error) {
        console.error('Error fetching lease data:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load lease data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lease) return;

    try {
      setIsSaving(true);

      // Prepare updated lease data
      const updatedLease: Lease = {
        ...lease,
        assetId: formData.asset_id,
        assetName: assets.find(a => a.id === formData.asset_id)?.name || lease.assetName,
        tenantId: formData.tenant_id,
        tenantName: tenants.find(t => t.id === formData.tenant_id)?.name || lease.tenantName,
        leaseType: formData.lease_type as any,
        startDate: formData.start_date.toISOString(),
        endDate: formData.end_date.toISOString(),
        baseRent: formData.base_rent,
        rentEscalation: formData.rent_escalation,
        securityDeposit: formData.security_deposit,
        leaseArea: formData.lease_area,
        status: formData.status as any,
        notes: formData.notes,
        updatedAt: new Date().toISOString()
      };

      // Save the lease
      saveLease(updatedLease);

      // In a real app, we would call the API
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

        await updateLease(lease.id, apiLeaseData);
      } catch (apiError) {
        console.error('API call failed, but local update succeeded:', apiError);
      }

      showToast({
        title: 'Success',
        description: 'Lease updated successfully',
        variant: 'success'
      });

      // Redirect back to lease management
      router.push('/tools/lease-management');
    } catch (error) {
      console.error('Error updating lease:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update lease',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Loading lease data...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Lease not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/tools/lease-management" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Lease</h1>
        </div>
        <Button
          className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Details</CardTitle>
          <CardDescription>Edit the lease information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="asset_id">Property</Label>
                <Select
                  value={formData.asset_id}
                  onValueChange={(value) => handleSelectChange('asset_id', value)}
                  disabled={true} // Disable changing the property for now
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => handleSelectChange('tenant_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease_type">Lease Type</Label>
                <Select
                  value={formData.lease_type}
                  onValueChange={(value) => handleSelectChange('lease_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lease type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Multifamily">Multifamily</SelectItem>
                    <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => handleDateChange('start_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => handleDateChange('end_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_rent">Monthly Base Rent ($)</Label>
                <Input
                  type="number"
                  id="base_rent"
                  name="base_rent"
                  value={formData.base_rent}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent_escalation">Annual Rent Escalation (%)</Label>
                <Input
                  type="number"
                  id="rent_escalation"
                  name="rent_escalation"
                  value={formData.rent_escalation}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                <Input
                  type="number"
                  id="security_deposit"
                  name="security_deposit"
                  value={formData.security_deposit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lease_area">Lease Area (sq ft)</Label>
                <Input
                  type="number"
                  id="lease_area"
                  name="lease_area"
                  value={formData.lease_area}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
