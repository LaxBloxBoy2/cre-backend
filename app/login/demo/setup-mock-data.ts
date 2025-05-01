'use client';

export function setupMockData() {
  if (typeof window === 'undefined') return;
  
  // Set up mock user data
  const mockUserData = {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'Manager', // Manager role can move deals in the pipeline
    org_id: '1'
  };
  
  // Store in localStorage
  localStorage.setItem('userData', JSON.stringify(mockUserData));
  console.log('Mock user data set up successfully');
}
