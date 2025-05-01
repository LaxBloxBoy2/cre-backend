'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { updateDeal } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface PropertyAttributesDialogProps {
  deal: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: (updatedDeal: any) => void;
}

export default function PropertyAttributesDialog({
  deal,
  open,
  onOpenChange,
  onDealUpdated
}: PropertyAttributesDialogProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    project_name: '',
    location: '',
    property_type: '',
    property_class: '',
    property_style: '',
    property_subtype: '',
    year_built: '',
    units: '',
    square_footage: '',
    lot_size: '',
    zoning: '',
    parking_spaces: '',
    acquisition_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deal && open) {
      setFormData({
        project_name: deal.project_name || '',
        location: deal.location || '',
        property_type: deal.property_type || '',
        property_class: deal.property_class || '',
        property_style: deal.property_style || '',
        property_subtype: deal.property_subtype || '',
        year_built: deal.year_built || '',
        units: deal.units?.toString() || '',
        square_footage: deal.square_footage?.toString() || '',
        lot_size: deal.lot_size || '',
        zoning: deal.zoning || '',
        parking_spaces: deal.parking_spaces?.toString() || '',
        acquisition_date: deal.acquisition_date || ''
      });
    }
  }, [deal, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert numeric fields
      const numericFields = {
        units: formData.units ? parseInt(formData.units) : undefined,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : undefined
      };

      const updatedDealData = {
        ...formData,
        ...numericFields
      };

      // Call the API to update the deal
      await updateDeal(deal.id, updatedDealData);

      // Create updated deal object
      const updatedDeal = {
        ...deal,
        ...updatedDealData
      };

      onDealUpdated(updatedDeal);
      showToast('Property attributes updated successfully', 'success');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating property attributes:', error);
      showToast('Failed to update property attributes', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = [
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'multifamily', label: 'Multifamily' },
    { value: 'mixed_use', label: 'Mixed Use' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'land', label: 'Land' }
  ];

  const propertyClasses = [
    { value: 'Class A', label: 'Class A' },
    { value: 'Class B', label: 'Class B' },
    { value: 'Class C', label: 'Class C' },
    { value: 'Class D', label: 'Class D' }
  ];

  const propertyStyles = [
    { value: 'Modern', label: 'Modern' },
    { value: 'Traditional', label: 'Traditional' },
    { value: 'Contemporary', label: 'Contemporary' },
    { value: 'Historic', label: 'Historic' },
    { value: 'Industrial', label: 'Industrial' }
  ];

  const propertySubtypes = [
    { value: 'High-rise', label: 'High-rise' },
    { value: 'Mid-rise', label: 'Mid-rise' },
    { value: 'Low-rise', label: 'Low-rise' },
    { value: 'Garden-style', label: 'Garden-style' },
    { value: 'Strip mall', label: 'Strip mall' },
    { value: 'Power center', label: 'Power center' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Flex space', label: 'Flex space' }
  ];

  const zoningTypes = [
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Residential', label: 'Residential' },
    { value: 'Industrial', label: 'Industrial' },
    { value: 'Mixed-use', label: 'Mixed-use' },
    { value: 'Special purpose', label: 'Special purpose' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" style={{ backgroundColor: 'var(--bg-card)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Edit Property Attributes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project_name" style={{ color: 'var(--text-muted)' }}>Property Name</Label>
              <Input
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" style={{ color: 'var(--text-muted)' }}>Address</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type" style={{ color: 'var(--text-muted)' }}>Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => handleSelectChange('property_type', value)}
              >
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  {propertyTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_class" style={{ color: 'var(--text-muted)' }}>Property Class</Label>
              <Select
                value={formData.property_class}
                onValueChange={(value) => handleSelectChange('property_class', value)}
              >
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <SelectValue placeholder="Select property class" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  {propertyClasses.map(cls => (
                    <SelectItem key={cls.value} value={cls.value}>{cls.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_style" style={{ color: 'var(--text-muted)' }}>Property Style</Label>
              <Select
                value={formData.property_style}
                onValueChange={(value) => handleSelectChange('property_style', value)}
              >
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <SelectValue placeholder="Select property style" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  {propertyStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_subtype" style={{ color: 'var(--text-muted)' }}>Property Subtype</Label>
              <Select
                value={formData.property_subtype}
                onValueChange={(value) => handleSelectChange('property_subtype', value)}
              >
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <SelectValue placeholder="Select property subtype" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  {propertySubtypes.map(subtype => (
                    <SelectItem key={subtype.value} value={subtype.value}>{subtype.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_built" style={{ color: 'var(--text-muted)' }}>Year Built</Label>
              <Input
                id="year_built"
                name="year_built"
                value={formData.year_built}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units" style={{ color: 'var(--text-muted)' }}>Units</Label>
              <Input
                id="units"
                name="units"
                type="number"
                value={formData.units}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="square_footage" style={{ color: 'var(--text-muted)' }}>Square Footage</Label>
              <Input
                id="square_footage"
                name="square_footage"
                type="number"
                value={formData.square_footage}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_size" style={{ color: 'var(--text-muted)' }}>Lot Size</Label>
              <Input
                id="lot_size"
                name="lot_size"
                value={formData.lot_size}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoning" style={{ color: 'var(--text-muted)' }}>Zoning</Label>
              <Select
                value={formData.zoning}
                onValueChange={(value) => handleSelectChange('zoning', value)}
              >
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  <SelectValue placeholder="Select zoning type" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}>
                  {zoningTypes.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>{zone.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parking_spaces" style={{ color: 'var(--text-muted)' }}>Parking Spaces</Label>
              <Input
                id="parking_spaces"
                name="parking_spaces"
                type="number"
                value={formData.parking_spaces}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition_date" style={{ color: 'var(--text-muted)' }}>Acquisition Date</Label>
              <Input
                id="acquisition_date"
                name="acquisition_date"
                value={formData.acquisition_date}
                onChange={handleChange}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-dark)'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                color: 'white'
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
