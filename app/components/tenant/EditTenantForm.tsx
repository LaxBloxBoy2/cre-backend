'use client';

import { useState } from 'react';
import { Tenant } from '@/lib/mock-leases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EditTenantFormProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTenant: Tenant) => void;
}

export function EditTenantForm({ tenant, isOpen, onClose, onSave }: EditTenantFormProps) {
  const [formData, setFormData] = useState({
    name: tenant.name,
    contactName: tenant.contactName,
    contactEmail: tenant.contactEmail,
    contactPhone: tenant.contactPhone,
    industry: tenant.industry,
    creditRating: tenant.creditRating,
    paymentHistory: tenant.paymentHistory,
    notes: tenant.notes,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <DialogTitle className="text-black dark:text-white">Edit Tenant Information</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Company Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-gray-700 dark:text-gray-300">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-gray-700 dark:text-gray-300">Contact Name</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-gray-700 dark:text-gray-300">Contact Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-gray-700 dark:text-gray-300">Contact Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditRating" className="text-gray-700 dark:text-gray-300">Credit Rating</Label>
              <Input
                id="creditRating"
                name="creditRating"
                value={formData.creditRating}
                onChange={handleChange}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentHistory" className="text-gray-700 dark:text-gray-300">Payment History</Label>
            <Select 
              value={formData.paymentHistory} 
              onValueChange={(value) => handleSelectChange('paymentHistory', value)}
            >
              <SelectTrigger className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                <SelectValue placeholder="Select payment history" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              rows={3}
            />
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
