// This script is for development purposes only
// It sets the demo token in localStorage to bypass authentication

if (typeof window !== 'undefined') {
  console.log('Setting demo tokens in localStorage');
  localStorage.setItem('accessToken', 'demo_access_token');
  localStorage.setItem('refreshToken', 'demo_refresh_token');
  console.log('Demo tokens set successfully');
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
