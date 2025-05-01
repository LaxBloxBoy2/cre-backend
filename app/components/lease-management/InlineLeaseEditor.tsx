'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Badge
} from '@/app/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar as CalendarComponent } from '@/app/components/ui/calendar';
import {
  Calendar,
  Check,
  X,
  Edit,
  Trash2,
  Save,
  DollarSign
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { formatCurrency } from '@/app/lib/utils/format';
import { Lease } from '@/app/lib/mock-leases';

interface InlineLeaseEditorProps {
  lease: Lease;
  assets: any[];
  tenants: any[];
  onSave: (updatedLease: Lease) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export default function InlineLeaseEditor({
  lease,
  assets,
  tenants,
  onSave,
  onCancel,
  onDelete
}: InlineLeaseEditorProps) {
  const [formData, setFormData] = useState({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = () => {
    const selectedAsset = assets.find(asset => asset.id === formData.asset_id);
    const selectedTenant = tenants.find(tenant => tenant.id === formData.tenant_id);

    if (!selectedAsset || !selectedTenant) {
      alert('Asset or tenant not found');
      return;
    }

    const updatedLease: Lease = {
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

    onSave(updatedLease);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="grid grid-cols-7 gap-4 items-center py-4 border-b border-gray-200 dark:border-[#2F374A] bg-gray-50 dark:bg-[#0F1117]">
      {/* Checkbox placeholder */}
      <div className="flex items-center">
        {/* Empty space to align with checkboxes */}
      </div>

      {/* Property / Tenant */}
      <div className="col-span-2 space-y-2">
        <div className="space-y-1">
          <Label htmlFor="asset_id" className="text-xs text-gray-700 dark:text-gray-300">Property</Label>
          <Select
            value={formData.asset_id}
            onValueChange={(value) => handleSelectChange('asset_id', value)}
          >
            <SelectTrigger className="h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
              {assets.map(asset => (
                <SelectItem key={asset.id} value={asset.id} className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="tenant_id" className="text-xs text-gray-700 dark:text-gray-300">Tenant</Label>
          <Select
            value={formData.tenant_id}
            onValueChange={(value) => handleSelectChange('tenant_id', value)}
          >
            <SelectTrigger className="h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id} className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lease Type */}
      <div className="space-y-1">
        <Label htmlFor="lease_type" className="text-xs text-gray-700 dark:text-gray-300">Type</Label>
        <Select
          value={formData.lease_type}
          onValueChange={(value) => handleSelectChange('lease_type', value)}
        >
          <SelectTrigger className="h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
            <SelectItem value="Office" className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">Office</SelectItem>
            <SelectItem value="Retail" className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">Retail</SelectItem>
            <SelectItem value="Industrial" className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">Industrial</SelectItem>
            <SelectItem value="Multifamily" className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">Multifamily</SelectItem>
            <SelectItem value="Mixed-Use" className="focus:bg-gray-100 dark:focus:bg-[#2A2E36] focus:text-gray-900 dark:focus:text-white">Mixed-Use</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Term */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-700 dark:text-gray-300">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2E36]",
                  !formData.start_date && "text-gray-500 dark:text-gray-500"
                )}
              >
                <Calendar className="mr-2 h-3 w-3 text-gray-500 dark:text-gray-400" />
                {formData.start_date ? formatDate(formData.start_date) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
              <CalendarComponent
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => handleDateChange('start_date', date)}
                initialFocus
                className="bg-white dark:bg-[#1A1D23] text-gray-900 dark:text-white"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-700 dark:text-gray-300">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2E36]",
                  !formData.end_date && "text-gray-500 dark:text-gray-500"
                )}
              >
                <Calendar className="mr-2 h-3 w-3 text-gray-500 dark:text-gray-400" />
                {formData.end_date ? formatDate(formData.end_date) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
              <CalendarComponent
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => handleDateChange('end_date', date)}
                initialFocus
                className="bg-white dark:bg-[#1A1D23] text-gray-900 dark:text-white"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Rent */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="base_rent" className="text-xs text-gray-700 dark:text-gray-300">Monthly Rent ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500 dark:text-gray-400" />
            <Input
              id="base_rent"
              name="base_rent"
              type="number"
              value={formData.base_rent}
              onChange={handleChange}
              className="pl-7 h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="lease_area" className="text-xs text-gray-700 dark:text-gray-300">Area (sq ft)</Label>
          <Input
            id="lease_area"
            name="lease_area"
            type="number"
            value={formData.lease_area}
            onChange={handleChange}
            className="h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="rent_escalation" className="text-xs text-gray-700 dark:text-gray-300">Escalation (%)</Label>
          <Input
            id="rent_escalation"
            name="rent_escalation"
            type="number"
            value={formData.rent_escalation}
            onChange={handleChange}
            className="h-8 text-sm bg-white dark:bg-[#1E222A] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSubmit}
          className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
        >
          <Save className="h-4 w-4" />
          <span className="sr-only">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(lease.id)}
          className="flex items-center bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-red-500 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
