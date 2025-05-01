'use client';

import api from './api';

// Get all custom fields for a tenant
export const getTenantCustomFields = async (tenantId: string) => {
  try {
    const response = await api.get(`/api/lease-management/tenants/${tenantId}/custom-fields`);
    
    // Convert backend model to frontend model
    return response.data.map((field: any) => ({
      id: field.id,
      name: field.name,
      value: field.value,
      type: field.field_type,
      options: field.options,
      createdAt: field.created_at
    }));
  } catch (error) {
    console.error(`Error fetching custom fields for tenant ${tenantId}:`, error);
    throw error;
  }
};

// Create a new custom field for a tenant
export const createCustomField = async (tenantId: string, fieldData: any) => {
  try {
    // Convert frontend model to backend model
    const backendFieldData = {
      name: fieldData.name,
      value: fieldData.value,
      field_type: fieldData.type,
      options: fieldData.options
    };
    
    const response = await api.post(`/api/lease-management/tenants/${tenantId}/custom-fields`, backendFieldData);
    
    // Convert backend model to frontend model
    return {
      id: response.data.id,
      name: response.data.name,
      value: response.data.value,
      type: response.data.field_type,
      options: response.data.options,
      createdAt: response.data.created_at
    };
  } catch (error) {
    console.error(`Error creating custom field for tenant ${tenantId}:`, error);
    throw error;
  }
};

// Update a custom field
export const updateCustomField = async (fieldId: string, fieldData: any) => {
  try {
    // Convert frontend model to backend model
    const backendFieldData = {
      name: fieldData.name,
      value: fieldData.value,
      field_type: fieldData.type,
      options: fieldData.options
    };
    
    const response = await api.put(`/api/lease-management/custom-fields/${fieldId}`, backendFieldData);
    
    // Convert backend model to frontend model
    return {
      id: response.data.id,
      name: response.data.name,
      value: response.data.value,
      type: response.data.field_type,
      options: response.data.options,
      createdAt: response.data.created_at
    };
  } catch (error) {
    console.error(`Error updating custom field ${fieldId}:`, error);
    throw error;
  }
};

// Delete a custom field
export const deleteCustomField = async (fieldId: string) => {
  try {
    await api.delete(`/api/lease-management/custom-fields/${fieldId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting custom field ${fieldId}:`, error);
    throw error;
  }
};
