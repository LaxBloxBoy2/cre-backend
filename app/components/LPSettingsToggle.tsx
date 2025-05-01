'use client';

import { useState } from 'react';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { GearIcon } from '@radix-ui/react-icons';

export default function LPSettingsToggle() {
  const { settings, updateSettings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleSettings}
        className="p-2 rounded-full bg-dark-card-hover hover:bg-dark-card-hover/80 text-text-secondary hover:text-white transition-colors duration-200"
        aria-label="Settings"
      >
        <GearIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-dark-card shadow-lg rounded-lg border border-dark-border z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-4">LP Portal Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  AI Metric Explanations
                </span>
                <button
                  onClick={() => updateSettings({ enableAIExplainer: !settings.enableAIExplainer })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableAIExplainer ? 'bg-accent' : 'bg-dark-card-hover'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableAIExplainer ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Deal Alerts
                </span>
                <button
                  onClick={() => updateSettings({ alertsEnabled: !settings.alertsEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.alertsEnabled ? 'bg-accent' : 'bg-dark-card-hover'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.alertsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
