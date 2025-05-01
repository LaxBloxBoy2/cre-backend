'use client';

import { useState } from 'react';
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
import { useToast } from '@/app/contexts/ToastContext';
import { saveTenant, createEmptyTenant } from '@/app/lib/mock-leases';

interface NewTenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTenantForm({ isOpen, onClose, onSuccess }: NewTenantFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    credit_rating: '',
    payment_history: 'Good',
    notes: ''
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a new tenant
      const newTenant = createEmptyTenant(formData.name);

      // Update the tenant with form data
      newTenant.contactName = formData.contact_name;
      newTenant.contactEmail = formData.contact_email;
      newTenant.contactPhone = formData.contact_phone;
      newTenant.industry = formData.industry;
      newTenant.creditRating = formData.credit_rating;
      newTenant.paymentHistory = formData.payment_history as any;
      newTenant.notes = formData.notes;

      // Save the tenant
      saveTenant(newTenant);

      showToast({
        title: 'Success',
        description: 'Tenant created successfully',
        variant: 'success'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating tenant:', error);
      showToast({
        title: 'Error',
        description: 'Failed to create tenant. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Enter the details for the new tenant. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Tenant Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </div>

            {/* Credit Rating */}
            <div className="space-y-2">
              <Label htmlFor="credit_rating">Credit Rating</Label>
              <Select
                value={formData.credit_rating}
                onValueChange={(value) => handleSelectChange('credit_rating', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="C+">C+</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="C-">C-</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <Label htmlFor="payment_history">Payment History *</Label>
              <Select
                value={formData.payment_history}
                onValueChange={(value) => handleSelectChange('payment_history', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment history" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
