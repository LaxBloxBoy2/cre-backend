'use client';

import { useState } from 'react';
import { CustomField, Tenant } from '@/lib/mock-leases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { generateUUID } from '@/lib/mock-funds';

interface CustomFieldsManagerProps {
  tenant: Tenant;
  onSave: (updatedTenant: Tenant) => void;
}

export function CustomFieldsManager({ tenant, onSave }: CustomFieldsManagerProps) {
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
  const [currentField, setCurrentField] = useState<CustomField | null>(null);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: '',
    value: '',
    type: 'text',
    options: [],
  });

  const handleAddField = () => {
    if (!newField.name || !newField.type) return;
    
    const customField: CustomField = {
      id: generateUUID(),
      name: newField.name,
      value: newField.value || '',
      type: newField.type as 'text' | 'number' | 'date' | 'boolean' | 'select',
      options: newField.type === 'select' ? newField.options : undefined,
      createdAt: new Date().toISOString(),
    };
    
    const updatedTenant = {
      ...tenant,
      customFields: [...(tenant.customFields || []), customField],
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedTenant);
    setNewField({
      name: '',
      value: '',
      type: 'text',
      options: [],
    });
    setIsAddFieldOpen(false);
  };

  const handleEditField = () => {
    if (!currentField || !currentField.name) return;
    
    const updatedTenant = {
      ...tenant,
      customFields: tenant.customFields?.map(field => 
        field.id === currentField.id ? currentField : field
      ),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedTenant);
    setCurrentField(null);
    setIsEditFieldOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedTenant = {
      ...tenant,
      customFields: tenant.customFields?.filter(field => field.id !== fieldId),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedTenant);
  };

  const handleOptionChange = (value: string, index: number) => {
    if (!newField.options) return;
    
    const newOptions = [...newField.options];
    newOptions[index] = value;
    setNewField({
      ...newField,
      options: newOptions,
    });
  };

  const handleAddOption = () => {
    setNewField({
      ...newField,
      options: [...(newField.options || []), ''],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!newField.options) return;
    
    const newOptions = [...newField.options];
    newOptions.splice(index, 1);
    setNewField({
      ...newField,
      options: newOptions,
    });
  };

  const handleEditOptionChange = (value: string, index: number) => {
    if (!currentField || !currentField.options) return;
    
    const newOptions = [...currentField.options];
    newOptions[index] = value;
    setCurrentField({
      ...currentField,
      options: newOptions,
    });
  };

  const handleEditAddOption = () => {
    if (!currentField) return;
    
    setCurrentField({
      ...currentField,
      options: [...(currentField.options || []), ''],
    });
  };

  const handleEditRemoveOption = (index: number) => {
    if (!currentField || !currentField.options) return;
    
    const newOptions = [...currentField.options];
    newOptions.splice(index, 1);
    setCurrentField({
      ...currentField,
      options: newOptions,
    });
  };

  return (
    <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-black dark:text-white">Custom Fields</CardTitle>
        <Button 
          size="sm"
          onClick={() => setIsAddFieldOpen(true)}
          className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </CardHeader>
      <CardContent>
        {tenant.customFields && tenant.customFields.length > 0 ? (
          <div className="space-y-4">
            {tenant.customFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-[#2F374A] rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">{field.name}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-gray-100 dark:bg-[#22272E] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full mr-2">
                      {field.type}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{field.value}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentField(field);
                      setIsEditFieldOpen(true);
                    }}
                    className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-red-500 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No custom fields yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add custom fields to store additional information about this tenant.
            </p>
          </div>
        )}
      </CardContent>

      {/* Add Field Dialog */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName" className="text-gray-700 dark:text-gray-300">Field Name</Label>
              <Input
                id="fieldName"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fieldType" className="text-gray-700 dark:text-gray-300">Field Type</Label>
              <Select 
                value={newField.type} 
                onValueChange={(value) => setNewField({ ...newField, type: value as any })}
              >
                <SelectTrigger id="fieldType" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newField.type === 'select' && (
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Options</Label>
                {newField.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(e.target.value, index)}
                      className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fieldValue" className="text-gray-700 dark:text-gray-300">Value</Label>
              {newField.type === 'select' ? (
                <Select 
                  value={newField.value} 
                  onValueChange={(value) => setNewField({ ...newField, value })}
                >
                  <SelectTrigger id="fieldValue" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                    {newField.options?.map((option, index) => (
                      <SelectItem key={index} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : newField.type === 'boolean' ? (
                <Select 
                  value={newField.value} 
                  onValueChange={(value) => setNewField({ ...newField, value })}
                >
                  <SelectTrigger id="fieldValue" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="fieldValue"
                  type={newField.type === 'number' ? 'number' : newField.type === 'date' ? 'date' : 'text'}
                  value={newField.value}
                  onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddFieldOpen(false)}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddField}
              className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
              disabled={!newField.name}
            >
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={isEditFieldOpen} onOpenChange={setIsEditFieldOpen}>
        <DialogContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Edit Custom Field</DialogTitle>
          </DialogHeader>
          {currentField && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFieldName" className="text-gray-700 dark:text-gray-300">Field Name</Label>
                <Input
                  id="editFieldName"
                  value={currentField.name}
                  onChange={(e) => setCurrentField({ ...currentField, name: e.target.value })}
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editFieldType" className="text-gray-700 dark:text-gray-300">Field Type</Label>
                <Select 
                  value={currentField.type} 
                  onValueChange={(value) => setCurrentField({ ...currentField, type: value as any })}
                >
                  <SelectTrigger id="editFieldType" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {currentField.type === 'select' && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Options</Label>
                  {currentField.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => handleEditOptionChange(e.target.value, index)}
                        className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRemoveOption(index)}
                        className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-red-500 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditAddOption}
                    className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="editFieldValue" className="text-gray-700 dark:text-gray-300">Value</Label>
                {currentField.type === 'select' ? (
                  <Select 
                    value={currentField.value} 
                    onValueChange={(value) => setCurrentField({ ...currentField, value })}
                  >
                    <SelectTrigger id="editFieldValue" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                      {currentField.options?.map((option, index) => (
                        <SelectItem key={index} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : currentField.type === 'boolean' ? (
                  <Select 
                    value={currentField.value} 
                    onValueChange={(value) => setCurrentField({ ...currentField, value })}
                  >
                    <SelectTrigger id="editFieldValue" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="editFieldValue"
                    type={currentField.type === 'number' ? 'number' : currentField.type === 'date' ? 'date' : 'text'}
                    value={currentField.value}
                    onChange={(e) => setCurrentField({ ...currentField, value: e.target.value })}
                    className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                  />
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditFieldOpen(false)}
              className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditField}
              className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
              disabled={!currentField?.name}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
