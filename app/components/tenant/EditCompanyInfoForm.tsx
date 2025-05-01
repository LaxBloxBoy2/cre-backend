'use client';

import { useState } from 'react';
import { Tenant } from '@/lib/mock-leases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EditCompanyInfoFormProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export function EditCompanyInfoForm({ tenant, isOpen, onClose, onSave }: EditCompanyInfoFormProps) {
  const [formData, setFormData] = useState({
    yearFounded: tenant.yearFounded,
    companySize: tenant.companySize || '',
    website: tenant.website || '',
    address: tenant.address || '',
    city: tenant.city || '',
    state: tenant.state || '',
    zipCode: tenant.zipCode || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
  };

  const handleSubmit = () => {
    const updatedTenant = {
      ...tenant,
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedTenant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white">Edit Company Information</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearFounded" className="text-gray-700 dark:text-gray-300">Year Founded</Label>
              <Input
                id="yearFounded"
                name="yearFounded"
                type="number"
                value={formData.yearFounded || ''}
                onChange={handleNumberChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-gray-700 dark:text-gray-300">Company Size</Label>
              <Input
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                placeholder="e.g. 10-50, 50-100"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website" className="text-gray-700 dark:text-gray-300">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              placeholder="https://www.example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-700 dark:text-gray-300">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-gray-700 dark:text-gray-300">State</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-gray-700 dark:text-gray-300">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
