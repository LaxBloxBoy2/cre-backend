'use client';

import { useState } from 'react';
import { Tenant } from '@/lib/mock-leases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EditFinancialInfoFormProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export function EditFinancialInfoForm({ tenant, isOpen, onClose, onSave }: EditFinancialInfoFormProps) {
  const [formData, setFormData] = useState({
    annualRevenue: tenant.annualRevenue,
    profitMargin: tenant.profitMargin,
    debtToEquityRatio: tenant.debtToEquityRatio,
    currentRatio: tenant.currentRatio,
    quickRatio: tenant.quickRatio,
  });

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
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
          <DialogTitle className="text-black dark:text-white">Edit Financial Information</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="annualRevenue" className="text-gray-700 dark:text-gray-300">Annual Revenue ($)</Label>
            <Input
              id="annualRevenue"
              name="annualRevenue"
              type="number"
              value={formData.annualRevenue || ''}
              onChange={handleNumberChange}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profitMargin" className="text-gray-700 dark:text-gray-300">Profit Margin (%)</Label>
              <Input
                id="profitMargin"
                name="profitMargin"
                type="number"
                step="0.1"
                value={formData.profitMargin || ''}
                onChange={handleNumberChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtToEquityRatio" className="text-gray-700 dark:text-gray-300">Debt to Equity Ratio</Label>
              <Input
                id="debtToEquityRatio"
                name="debtToEquityRatio"
                type="number"
                step="0.1"
                value={formData.debtToEquityRatio || ''}
                onChange={handleNumberChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentRatio" className="text-gray-700 dark:text-gray-300">Current Ratio</Label>
              <Input
                id="currentRatio"
                name="currentRatio"
                type="number"
                step="0.1"
                value={formData.currentRatio || ''}
                onChange={handleNumberChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickRatio" className="text-gray-700 dark:text-gray-300">Quick Ratio</Label>
              <Input
                id="quickRatio"
                name="quickRatio"
                type="number"
                step="0.1"
                value={formData.quickRatio || ''}
                onChange={handleNumberChange}
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
