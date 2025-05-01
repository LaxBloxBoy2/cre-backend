import React, { useState } from 'react';
import { updateDeal } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface IntegrationsTabProps {
  dealId: string;
  dealData: {
    id: string;
    project_name: string;
    integrate_with_leases?: boolean;
    integrate_with_documents?: boolean;
    integrate_with_calendar?: boolean;
  };
  onUpdate?: (updatedDeal: any) => void;
}

export default function IntegrationsTab({ dealId, dealData, onUpdate }: IntegrationsTabProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState({
    integrate_with_leases: dealData.integrate_with_leases || false,
    integrate_with_documents: dealData.integrate_with_documents || false,
    integrate_with_calendar: dealData.integrate_with_calendar || false,
  });

  const handleToggle = (field: string) => {
    setIntegrations(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
  };

  const saveIntegrations = async () => {
    try {
      setSaving(true);
      const updatedDeal = await updateDeal(dealId, integrations);
      showToast('Integration settings updated successfully', 'success');
      if (onUpdate) {
        onUpdate(updatedDeal);
      }
    } catch (error) {
      console.error('Error updating integration settings:', error);
      showToast('Failed to update integration settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium mb-6" style={{ color: 'var(--text-primary)' }}>Integration Settings</h3>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Configure how this deal integrates with other modules in the platform.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Lease Management</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Connect this deal with the lease management system to track leases and tenants.
              </p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={integrations.integrate_with_leases}
                  onChange={() => handleToggle('integrate_with_leases')}
                />
                <div className={`w-11 h-6 rounded-full peer ${integrations.integrate_with_leases ? 'bg-accent' : 'bg-gray-700'} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Document Management</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Link this deal with the document management system for centralized document storage.
              </p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={integrations.integrate_with_documents}
                  onChange={() => handleToggle('integrate_with_documents')}
                />
                <div className={`w-11 h-6 rounded-full peer ${integrations.integrate_with_documents ? 'bg-accent' : 'bg-gray-700'} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Calendar</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Integrate this deal with the calendar system to track important dates and events.
              </p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={integrations.integrate_with_calendar}
                  onChange={() => handleToggle('integrate_with_calendar')}
                />
                <div className={`w-11 h-6 rounded-full peer ${integrations.integrate_with_calendar ? 'bg-accent' : 'bg-gray-700'} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-[#30E3CA] to-[#11999E] text-white rounded-md hover:shadow-accent-glow transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={saveIntegrations}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Integration Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
