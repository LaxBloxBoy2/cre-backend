'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserSettings {
  enableAIExplainer: boolean;
  alertsEnabled: boolean;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
  enableAIExplainer: true,
  alertsEnabled: true,
};

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
