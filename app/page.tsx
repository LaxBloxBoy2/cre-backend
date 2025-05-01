'use client';

import SimpleLayout from './components/SimpleLayout';

export default function HomePage() {
  return (
    <SimpleLayout>
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent)' }}>QAPT</span> Platform
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome to the QAPT Real Estate Platform</p>
          <div className="mt-8 space-y-4">
            <div>
              <a
                href="/login"
                className="px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 inline-block"
                style={{
                  background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))`,
                  color: 'white',
                  boxShadow: 'var(--shadow-neon)'
                }}
              >
                Login
              </a>
            </div>
            <div>
              <a
                href="/login/demo"
                className="px-6 py-3 rounded-md transition-all duration-200 hover:scale-105 inline-block"
                style={{
                  background: `linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))`,
                  color: 'white',
                  opacity: 0.8,
                  boxShadow: 'var(--shadow-neon)'
                }}
              >
                Demo Login
              </a>
            </div>
            <div>
              <a
                href="/dashboard"
                className="px-6 py-3 rounded-md transition-all duration-200 inline-block"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-dark)'
                }}
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}
