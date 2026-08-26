import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Users, UserCircle, Map, LogOut, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { logout } from '../../modules/auth/store/authSlice';
import type { RootState } from '../../app/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rides', href: '/rides', icon: Map },
  { name: 'Riders', href: '/riders', icon: UserCircle },
  { name: 'Passengers', href: '/passengers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { name, email, role } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (nameStr: string) => {
    return nameStr ? nameStr.charAt(0).toUpperCase() : 'A';
  };

  const displayRole = role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-woosh-divider flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-woosh-divider">
          <img src="/woosh_logo.png" alt="Woosh" className="h-8 w-auto" />
          <span className="ml-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-woosh-light-pink text-woosh-primary whitespace-nowrap">
            {displayRole}
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-woosh-primary text-white shadow-md shadow-woosh-shadow-pink"
                      : "text-woosh-light hover:bg-woosh-light-pink hover:text-woosh-primary"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      size={20} 
                      className={cn(
                        "transition-transform duration-200", 
                        isActive ? "scale-110" : "group-hover:scale-110"
                      )} 
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-woosh-divider">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-woosh-light hover:bg-red-50 hover:text-woosh-error transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-woosh-divider flex items-center justify-between px-6 z-10 shadow-sm shadow-black/5">
          <div className="flex items-center gap-4 md:hidden">
             {/* Mobile menu toggle will go here */}
             <img src="/woosh_logo.png" alt="Woosh" className="h-8 w-auto" />
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-woosh-primary flex items-center justify-center text-white font-bold shadow-md uppercase">
              {getInitials(name || '')}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-woosh-dark">{name || 'Admin User'}</p>
              <p className="text-xs text-woosh-light">{email || 'admin@woosh.com'}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
