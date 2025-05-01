'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent form from clearing inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Hardcoded credentials for demo - this is the most reliable way to login
      if (email === 'analyst@example.com' && password === 'password123') {
        console.log('Using demo credentials');

        // Clear any existing tokens first
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Small delay to ensure localStorage is cleared
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate successful login
        localStorage.setItem('accessToken', 'demo_access_token');
        localStorage.setItem('refreshToken', 'demo_refresh_token');

        console.log('Demo login successful, tokens saved');

        // Small delay to ensure tokens are saved before redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to dashboard
        console.log('Redirecting to dashboard after demo login');
        router.push('/dashboard');
        return;
      }

      // If not using demo credentials, try the real API
      // The backend expects /login endpoint for authentication
      const API_URL = 'https://cre-backend-0pvq.onrender.com/login';

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      console.log('Sending login request to:', API_URL);

      // Clear any existing tokens first
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      console.log('Login successful, received tokens');

      // Save tokens
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);

      // Small delay to ensure tokens are saved before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to dashboard
      console.log('Redirecting to dashboard after API login');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div>
          <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent)' }}>QAPT</span> Platform
          </h1>
          <p className="mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setEmail(newValue);
                  console.log('Email updated:', newValue);
                }}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPassword(newValue);
                  console.log('Password updated (length):', newValue.length);
                }}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))`,
                boxShadow: 'var(--shadow-neon)'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              Demo credentials:
            </p>
            <p style={{ color: 'var(--text-primary)' }}>
              Email: <span style={{ color: 'var(--accent)' }}>analyst@example.com</span>
            </p>
            <p style={{ color: 'var(--text-primary)' }}>
              Password: <span style={{ color: 'var(--accent)' }}>password123</span>
            </p>
            <div className="mt-4">
              <a
                href="/login/demo"
                className="px-4 py-2 rounded-md transition-all duration-200 inline-block"
                style={{
                  background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))`,
                  color: 'white',
                  opacity: 0.8,
                  boxShadow: 'var(--shadow-neon)'
                }}
              >
                Quick Demo Login
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
