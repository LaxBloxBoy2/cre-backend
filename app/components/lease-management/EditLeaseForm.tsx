'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import { saveLease, getAllTenants, Lease } from '@/app/lib/mock-leases';
import { updateLease } from '@/app/lib/api'; // This is the correct updateLease from api.ts
import { format } from 'date-fns';

// Date picker component
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as CalendarComponent } from '@/app/components/ui/calendar';
import { cn } from '@/app/lib/utils';

interface EditLeaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lease: Lease | null;
  assets: any[];
}

export default function EditLeaseForm({ isOpen, onClose, onSuccess, lease, assets }: EditLeaseFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

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

  // Load lease data when the form opens
  useEffect(() => {
    if (isOpen && lease) {
      setFormData({
        asset_id: lease.assetId,
        tenant_id: lease.tenantId,
        lease_type: lease.leaseType,
        start_date: new Date(lease.startDate),
        end_date: new Date(lease.endDate),
        base_rent: lease.baseRent,
        rent_escalation: lease.rentEscalation,
        security_deposit: lease.securityDeposit,
        lease_area: lease.leaseArea,
        status: lease.status,
        notes: lease.notes || ''
      });
    }
  }, [isOpen, lease]);

  // Load tenants
  useEffect(() => {
    const loadTenants = () => {
      try {
        const tenantsData = getAllTenants();
        setTenants(tenantsData);
      } catch (error) {
        console.error('Error loading tenants:', error);
      }
    };

    if (isOpen) {
      loadTenants();
    }
  }, [isOpen]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'base_rent' || name === 'rent_escalation' || name === 'security_deposit' || name === 'lease_area'
        ? parseFloat(value) || 0
        : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lease) {
      showToast({
        title: 'Error',
        description: 'No lease selected for editing',
        variant: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the selected asset and tenant
      const selectedAsset = assets.find(asset => asset.id === formData.asset_id);
      const selectedTenant = tenants.find(tenant => tenant.id === formData.tenant_id);

      if (!selectedAsset || !selectedTenant) {
        throw new Error('Asset or tenant not found');
      }

      // Update the lease with form data
      const updatedLease = {
        ...lease,
        assetId: formData.asset_id,
        assetName: selectedAsset.name,
        tenantId: formData.tenant_id,
        tenantName: selectedTenant.name,
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

      // Save the lease locally
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

        await updateLease(lease.id, apiLeaseData);
      } catch (apiError) {
        console.error('API call failed, but local update succeeded:', apiError);
      }

      showToast({
        title: 'Success',
        description: 'Lease updated successfully',
        variant: 'success'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating lease:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update lease. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Lease</DialogTitle>
          <DialogDescription>
            Update the details for this lease. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="asset_id">Property / Asset *</Label>
              <Select
                value={formData.asset_id}
                onValueChange={(value) => handleSelectChange('asset_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Selection */}
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => handleSelectChange('tenant_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lease Type */}
            <div className="space-y-2">
              <Label htmlFor="lease_type">Lease Type *</Label>
              <Select
                value={formData.lease_type}
                onValueChange={(value) => handleSelectChange('lease_type', value)}
                required
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

            {/* Lease Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
                required
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

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => handleDateChange('end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Base Rent */}
            <div className="space-y-2">
              <Label htmlFor="base_rent">Monthly Base Rent ($) *</Label>
              <Input
                id="base_rent"
                name="base_rent"
                type="number"
                value={formData.base_rent}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Rent Escalation */}
            <div className="space-y-2">
              <Label htmlFor="rent_escalation">Annual Rent Escalation (%) *</Label>
              <Input
                id="rent_escalation"
                name="rent_escalation"
                type="number"
                value={formData.rent_escalation}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
              />
            </div>

            {/* Security Deposit */}
            <div className="space-y-2">
              <Label htmlFor="security_deposit">Security Deposit ($)</Label>
              <Input
                id="security_deposit"
                name="security_deposit"
                type="number"
                value={formData.security_deposit}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            {/* Lease Area */}
            <div className="space-y-2">
              <Label htmlFor="lease_area">Lease Area (sq ft) *</Label>
              <Input
                id="lease_area"
                name="lease_area"
                type="number"
                value={formData.lease_area}
                onChange={handleChange}
                required
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
