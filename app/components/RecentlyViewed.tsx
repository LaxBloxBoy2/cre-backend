'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../lib/api';

interface RecentDeal {
  id: string;
  project_name: string;
  timestamp: number;
}

export default function RecentlyViewed() {
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const pathname = usePathname();

  // Load recent deals from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDeals = localStorage.getItem('recentlyViewedDeals');
      if (savedDeals) {
        try {
          const parsedDeals = JSON.parse(savedDeals);
          setRecentDeals(parsedDeals);
        } catch (error) {
          console.error('Error parsing recently viewed deals:', error);
        }
      }
    }
  }, []);

  // Track current deal view
  useEffect(() => {
    // Check if we're on a deal page
    const dealMatch = pathname.match(/^\/deals\/([a-zA-Z0-9-]+)(?:\/.*)?$/);
    if (dealMatch && dealMatch[1]) {
      const dealId = dealMatch[1];

      // Fetch deal details
      const fetchDealDetails = async () => {
        try {
          // Check if we're using demo token - if so, use demo data
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token === 'demo_access_token') {
              // Use demo data
              addToRecentlyViewed({
                id: dealId,
                project_name: `Demo Deal ${dealId.slice(-2)}`,
                timestamp: Date.now()
              });
              return;
            }
          }

          const response = await api.get(`/api/deals/${dealId}`);
          const deal = response.data;

          // Add to recently viewed
          addToRecentlyViewed({
            id: dealId,
            project_name: deal.project_name,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error fetching deal details:', error);
          // Add a fallback entry even if the API call fails
          addToRecentlyViewed({
            id: dealId,
            project_name: `Deal ${dealId.slice(-5)}`,
            timestamp: Date.now()
          });
        }
      };

      fetchDealDetails();
    }
  }, [pathname]);

  // Add a deal to recently viewed
  const addToRecentlyViewed = (deal: RecentDeal) => {
    setRecentDeals(prev => {
      // Remove if already exists
      const filtered = prev.filter(d => d.id !== deal.id);

      // Add to beginning
      const updated = [deal, ...filtered].slice(0, 5); // Keep only 5 most recent

      // Save to localStorage
      localStorage.setItem('recentlyViewedDeals', JSON.stringify(updated));

      return updated;
    });
  };

  if (recentDeals.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 px-4">
      <h3 className="text-sm font-medium text-text-secondary mb-2">Recently Viewed</h3>
      <ul className="space-y-1">
        {recentDeals.map(deal => (
          <li key={deal.id}>
            <Link
              href={`/deals/${deal.id}`}
              className="text-sm text-text-secondary hover:text-white transition-colors duration-200 block py-1 px-2 rounded hover:bg-dark-card-hover"
            >
              {deal.project_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
