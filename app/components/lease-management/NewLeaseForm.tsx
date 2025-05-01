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
import { saveLease, createEmptyLease, getAllTenants } from '@/app/lib/mock-leases';
import { format } from 'date-fns';

// Date picker component
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as CalendarComponent } from '@/app/components/ui/calendar';
import { cn } from '@/app/lib/utils';

interface NewLeaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: any[];
}

export default function NewLeaseForm({ isOpen, onClose, onSuccess, assets }: NewLeaseFormProps) {
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
    notes: '',
    renewalOptions: []
  });

  // Load tenants
  useEffect(() => {
    if (isOpen) {
      try {
        const tenantsData = getAllTenants();
        setTenants(tenantsData);
      } catch (error) {
        console.error('Error loading tenants:', error);
      }
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
    setIsSubmitting(true);

    try {
      // Get the selected asset and tenant
      const selectedAsset = assets.find(asset => asset.id === formData.asset_id);
      const selectedTenant = tenants.find(tenant => tenant.id === formData.tenant_id);

      if (!selectedAsset || !selectedTenant) {
        throw new Error('Asset or tenant not found');
      }

      // Create a new lease
      const newLease = createEmptyLease(
        formData.asset_id,
        selectedAsset.name,
        formData.tenant_id,
        selectedTenant.name
      );

      // Update the lease with form data
      newLease.leaseType = formData.lease_type as any;
      newLease.startDate = formData.start_date.toISOString();
      newLease.endDate = formData.end_date.toISOString();
      newLease.baseRent = formData.base_rent;
      newLease.rentEscalation = formData.rent_escalation;
      newLease.securityDeposit = formData.security_deposit;
      newLease.leaseArea = formData.lease_area;
      newLease.status = formData.status as any;
      newLease.notes = formData.notes;

      // Save the lease
      saveLease(newLease);

      showToast({
        title: 'Success',
        description: 'Lease created successfully',
        variant: 'success'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lease:', error);
      showToast({
        title: 'Error',
        description: 'Failed to create lease. Please try again.',
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
          <DialogTitle>Add New Lease</DialogTitle>
          <DialogDescription>
            Enter the details for the new lease. All fields marked with * are required.
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
              {isSubmitting ? 'Creating...' : 'Create Lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
