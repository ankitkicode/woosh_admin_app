import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-woosh-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-woosh-secondary/10 blur-[100px]" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
        <img src="/woosh_logo.png" alt="Woosh Logo" className="h-16 w-auto mb-4" />
        <h2 className="text-center text-3xl font-extrabold text-woosh-dark">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-woosh-light">
          Sign in to access the control panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-woosh-shadow-pink sm:rounded-2xl sm:px-10 border border-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
