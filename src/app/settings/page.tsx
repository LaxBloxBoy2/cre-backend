'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [explainerModeEnabled, setExplainerModeEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [compactViewEnabled, setCompactViewEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200">
          Save Changes
        </button>
      </div>

      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-dark-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'profile'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'account'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'preferences'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'notifications'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'api'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            API Keys
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    defaultValue="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    defaultValue="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    defaultValue="Investment Analyst"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    defaultValue="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Bio
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={4}
                  defaultValue="Commercial real estate investment analyst with 5+ years of experience in office and retail properties."
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">User Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Dark Mode</h3>
                    <p className="text-sm text-text-secondary">
                      Enable dark mode for the application interface
                    </p>
                  </div>
                  <button
                    onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      darkModeEnabled ? 'bg-accent' : 'bg-dark-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        darkModeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Explainer Mode</h3>
                    <p className="text-sm text-text-secondary">
                      Show explanations for financial metrics and calculations
                    </p>
                  </div>
                  <button
                    onClick={() => setExplainerModeEnabled(!explainerModeEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      explainerModeEnabled ? 'bg-accent' : 'bg-dark-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        explainerModeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Compact View</h3>
                    <p className="text-sm text-text-secondary">
                      Use a more compact layout to show more content
                    </p>
                  </div>
                  <button
                    onClick={() => setCompactViewEnabled(!compactViewEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      compactViewEnabled ? 'bg-accent' : 'bg-dark-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        compactViewEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Default Dashboard View</h3>
                <select className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent">
                  <option>Summary View</option>
                  <option>Financial Metrics</option>
                  <option>Deal Pipeline</option>
                  <option>Portfolio Performance</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    notificationsEnabled ? 'bg-accent' : 'bg-dark-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Deal Updates</h3>
                    <p className="text-sm text-text-secondary">
                      Notifications for status changes and updates to deals
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">In-app</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Task Reminders</h3>
                    <p className="text-sm text-text-secondary">
                      Notifications for upcoming and overdue tasks
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">In-app</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Comments</h3>
                    <p className="text-sm text-text-secondary">
                      Notifications when someone comments on your deals
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">In-app</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Risk Alerts</h3>
                    <p className="text-sm text-text-secondary">
                      Notifications for high-risk deals and market changes
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-text-secondary">In-app</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Account Settings</h2>
              
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <button className="px-4 py-2 bg-accent text-dark-bg rounded-md hover:shadow-accent-glow transition-all duration-200">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-border">
                <h3 className="text-sm font-medium text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <button className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200">
                  Enable 2FA
                </button>
              </div>

              <div className="pt-4 border-t border-dark-border">
                <h3 className="text-sm font-medium text-error mb-2">Danger Zone</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-4 py-2 bg-error/20 text-error rounded-md hover:bg-error/30 transition-all duration-200">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <p className="text-sm text-text-secondary">
                Manage your API keys for integrating with external services.
              </p>

              <div className="bg-dark-bg rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">Production API Key</h3>
                    <p className="text-xs text-text-secondary">Last used: 2 days ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-dark-card-hover text-text-secondary rounded-md text-sm hover:text-white transition-all duration-200">
                      Regenerate
                    </button>
                    <button className="px-3 py-1 bg-error/20 text-error rounded-md text-sm hover:bg-error/30 transition-all duration-200">
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center bg-dark-card p-2 rounded-md">
                  <div className="flex-1 font-mono text-sm text-text-secondary">
                    ••••••••••••••••••••••••••••••
                  </div>
                  <button className="text-text-secondary hover:text-accent transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-dark-bg rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">Development API Key</h3>
                    <p className="text-xs text-text-secondary">Last used: 5 hours ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-dark-card-hover text-text-secondary rounded-md text-sm hover:text-white transition-all duration-200">
                      Regenerate
                    </button>
                    <button className="px-3 py-1 bg-error/20 text-error rounded-md text-sm hover:bg-error/30 transition-all duration-200">
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center bg-dark-card p-2 rounded-md">
                  <div className="flex-1 font-mono text-sm text-text-secondary">
                    ••••••••••••••••••••••••••••••
                  </div>
                  <button className="text-text-secondary hover:text-accent transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <button className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200">
                Create New API Key
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
