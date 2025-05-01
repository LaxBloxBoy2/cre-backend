export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-accent">CRE</span> Platform
        </h1>
        <p className="text-text-secondary">Welcome to the Commercial Real Estate Platform</p>
        <div className="mt-8 space-y-4">
          <div>
            <a
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200 hover:scale-105 inline-block"
            >
              Login
            </a>
          </div>
          <div>
            <a
              href="/dashboard"
              className="px-6 py-3 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200 inline-block"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
