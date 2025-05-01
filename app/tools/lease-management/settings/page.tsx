'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { useToast } from '@/app/contexts/ToastContext';
import { Settings, Save, RefreshCw, Calendar, FileText, Building } from 'lucide-react';
import { getRentRollSettings as apiGetSettings, updateRentRollSettings as apiUpdateSettings } from '@/app/lib/api/rent-roll';
import { getRentRollSettings as mockGetSettings, updateRentRollSettings as mockUpdateSettings } from '@/app/lib/mock-leases';

interface RentRollSettings {
  integrate_with_deals: boolean;
  integrate_with_documents: boolean;
  integrate_with_calendar: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<RentRollSettings>({
    integrate_with_deals: true,
    integrate_with_documents: true,
    integrate_with_calendar: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);

        // Try to get settings from API first
        try {
          const data = await apiGetSettings();
          setSettings(data);
          console.log('Settings loaded from API:', data);
        } catch (apiError) {
          console.log('API error, falling back to mock data:', apiError);
          // If API fails, fall back to mock data
          const mockData = mockGetSettings();
          setSettings(mockData);
          console.log('Settings loaded from mock data:', mockData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [showToast]);

  const handleToggle = (key: keyof RentRollSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Try to update settings via API first
      try {
        await apiUpdateSettings(settings);
        console.log('Settings saved to API:', settings);
      } catch (apiError) {
        console.log('API error, falling back to mock data:', apiError);
        // If API fails, fall back to mock data
        mockUpdateSettings(settings);
        console.log('Settings saved to mock data:', settings);
      }

      showToast({
        title: 'Success',
        description: 'Settings saved successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-2 h-8 w-8" />
          Lease Management Settings
        </h1>
        <Button
          className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Settings</CardTitle>
          <CardDescription>
            Configure how the lease management system integrates with other modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="deals-integration" className="text-base">Deal Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect leases to deals for comprehensive deal analysis
                    </p>
                  </div>
                </div>
                <Switch
                  id="deals-integration"
                  checked={settings.integrate_with_deals}
                  onCheckedChange={() => handleToggle('integrate_with_deals')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="documents-integration" className="text-base">Document Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect leases to the document management system
                    </p>
                  </div>
                </div>
                <Switch
                  id="documents-integration"
                  checked={settings.integrate_with_documents}
                  onCheckedChange={() => handleToggle('integrate_with_documents')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="calendar-integration" className="text-base">Calendar Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Add lease events to the calendar system
                    </p>
                  </div>
                </div>
                <Switch
                  id="calendar-integration"
                  checked={settings.integrate_with_calendar}
                  onCheckedChange={() => handleToggle('integrate_with_calendar')}
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Changes will apply to all new leases and can be overridden on a per-lease basis
          </p>
          <Button variant="outline" onClick={() => router.push('/tools/lease-management')}>
            Back to Lease Management
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
