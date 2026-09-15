import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-woosh-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Subtle decorative element */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-woosh-primary via-pink-400 to-woosh-primary" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
        <img src="/woosh_logo.png" alt="Woosh Logo" className="h-12 w-auto mb-5" />
        <h2 className="text-center text-2xl font-bold text-woosh-dark">
          Admin Portal
        </h2>
        <p className="mt-1.5 text-center text-sm text-woosh-muted">
          Sign in to access the control panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-[var(--shadow-woosh-lg)] border border-woosh-border rounded-xl">
          <Outlet />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-woosh-placeholder">
        © {new Date().getFullYear()} Woosh. All rights reserved.
      </p>
    </div>
  );
}
