'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import TeamManagement from '../components/TeamManagement';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useUserSettings();
  const { isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // In a real app, we would fetch user data from the API
    // For now, we'll just use mock data
    setUserName('John Doe');
    setUserRole('Analyst');
    setLoading(false);
  }, [router]);

  const handleToggleAIExplainer = () => {
    updateSettings({
      enableAIExplainer: !settings.enableAIExplainer,
    });
  };

  // Debug tools for development mode
  const isDevMode = process.env.NODE_ENV === 'development';

  // Function to reset database
  const handleResetDB = async () => {
    if (confirm('Are you sure you want to reset the database? This will delete all data.')) {
      try {
        // In a real app, we would call an API endpoint to reset the database
        // For now, we'll just clear localStorage
        const theme = localStorage.getItem('theme');
        localStorage.clear();

        // Keep the access token so we don't get logged out
        localStorage.setItem('accessToken', 'mock-token');

        // Restore theme setting
        if (theme) {
          localStorage.setItem('theme', theme);
        }

        // Show success message
        alert('Database reset successfully. Please refresh the page.');

        // Reload the page
        window.location.reload();
      } catch (error) {
        console.error('Error resetting database:', error);
        alert('Failed to reset database.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">Settings</h2>
        </div>
      </div>

      <div className="dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white mb-4">User Settings</h3>

          <div className="border-t border-dark-card-hover pt-4">
            <dl className="divide-y divide-dark-card-hover">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-text-secondary">Name</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{userName}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-text-secondary">Role</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{userRole}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10">
        <div className="px-4 py-5 sm:p-6">
          <TeamManagement />
        </div>
      </div>

      <div className="mt-6 dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white mb-4">Display Settings</h3>

          <div className="border-t border-dark-card-hover pt-4">
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Dark Mode</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Toggle between dark and light mode.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Toggling theme from', isDarkMode ? 'dark' : 'light', 'to', !isDarkMode ? 'dark' : 'light');
                    toggleTheme();
                  }}
                  className={`${
                    isDarkMode ? 'bg-gradient-to-r from-[#30E3CA] to-[#11999E]' : 'bg-dark-card-hover'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent`}
                  aria-pressed={isDarkMode}
                >
                  <span className="sr-only">Toggle Dark Mode</span>
                  <span
                    className={`${
                      isDarkMode ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-dark-bg shadow transform ring-0 transition ease-in-out duration-200`}
                  >
                    <span
                      className={`${
                        isDarkMode
                          ? 'opacity-0 ease-out duration-100'
                          : 'opacity-100 ease-in duration-200'
                      } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                      aria-hidden="true"
                    >
                      {/* Sun icon */}
                      <svg className="h-3 w-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </span>
                    <span
                      className={`${
                        isDarkMode
                          ? 'opacity-100 ease-in duration-200'
                          : 'opacity-0 ease-out duration-100'
                      } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                      aria-hidden="true"
                    >
                      {/* Moon icon */}
                      <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div className="py-4 border-t border-dark-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Enable AI Metric Explanations</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Show AI-powered explanations for financial metrics throughout the platform.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAIExplainer}
                  className={`${
                    settings.enableAIExplainer ? 'bg-gradient-to-r from-[#30E3CA] to-[#11999E]' : 'bg-dark-card-hover'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent`}
                  aria-pressed={settings.enableAIExplainer}
                >
                  <span className="sr-only">Enable AI Metric Explanations</span>
                  <span
                    className={`${
                      settings.enableAIExplainer ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-dark-bg shadow transform ring-0 transition ease-in-out duration-200`}
                  >
                    <span
                      className={`${
                        settings.enableAIExplainer
                          ? 'opacity-0 ease-out duration-100'
                          : 'opacity-100 ease-in duration-200'
                      } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3 text-text-secondary" fill="none" viewBox="0 0 12 12">
                        <path
                          d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      className={`${
                        settings.enableAIExplainer
                          ? 'opacity-100 ease-in duration-200'
                          : 'opacity-0 ease-out duration-100'
                      } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Tools (Development Mode Only) */}
      {isDevMode && (
        <div className="mt-6 dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10 border border-amber-900/30">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-amber-400">Developer Tools</h3>
                <p className="text-sm text-text-secondary mt-1">
                  These tools are only available in development mode.
                </p>
              </div>
            </div>

            <div className="border-t border-dark-card-hover mt-4 pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Database Actions</h4>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleResetDB}
                      className="px-4 py-2 bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50 transition-colors duration-200"
                    >
                      Reset Database
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
