'use client';

import React, { useState } from 'react';
import { runUnderwriting } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface GoogleMapProps {
  location: string;
  dealId: string;
}

export default function GoogleMap({ location, dealId }: GoogleMapProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // For a real implementation, we would use the Google Maps API
  // For now, we'll just use a hardcoded iframe
  const encodedLocation = encodeURIComponent(location);

  const handleRunUnderwriting = async () => {
    setLoading(true);

    try {
      // In a real app, this would call the API
      if (process.env.NODE_ENV === 'production') {
        const result = await runUnderwriting(dealId);
        showToast('Underwriting completed successfully!', 'success');
      } else {
        // Simulate API call for development
        await new Promise(resolve => setTimeout(resolve, 2000));
        showToast('Underwriting completed successfully!', 'success');
      }
    } catch (error) {
      console.error('Error running underwriting:', error);
      showToast('Failed to run underwriting. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Location</h3>
        <button
          type="button"
          onClick={handleRunUnderwriting}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              Run Underwriting
              <svg className="ml-1 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
      <div className="h-64 w-full">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBhKxZeaFyQXp9YCJKmB5-JGjKjpJGzAJQ&q=${encodedLocation}`}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
