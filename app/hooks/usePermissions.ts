'use client';

import { useEffect, useState } from 'react';

type UserRole = 'Owner' | 'Manager' | 'Analyst' | 'Viewer';

export function usePermissions() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch the user's role from the API
    // For now, we'll just get it from localStorage
    const fetchUserRole = () => {
      setIsLoading(true);
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const { role } = JSON.parse(userData);
          setUserRole(role as UserRole);
        } else {
          // Default to Manager for demo purposes if no role is found
          setUserRole('Manager');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to Analyst for safety
        setUserRole('Analyst');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const canEditDeals = !isLoading && (userRole === 'Owner' || userRole === 'Manager');
  const canViewDeals = !isLoading && !!userRole;
  const canCreateDeals = !isLoading && (userRole === 'Owner' || userRole === 'Manager');
  const canDeleteDeals = !isLoading && userRole === 'Owner';
  // Always allow moving deals in the pipeline for testing
  const canMoveDealsPipeline = true; // !isLoading && (userRole === 'Owner' || userRole === 'Manager');

  return {
    userRole,
    isLoading,
    canEditDeals,
    canViewDeals,
    canCreateDeals,
    canDeleteDeals,
    canMoveDealsPipeline
  };
}
