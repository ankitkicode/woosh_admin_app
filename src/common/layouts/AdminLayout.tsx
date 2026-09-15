import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, UserCircle, Map, LogOut, Settings,
  MapPin, Menu, ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { logout } from '../../modules/auth/store/authSlice';
import { Avatar } from '../components/Avatar';
import type { RootState } from '../../app/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rides', href: '/rides', icon: Map },
  { name: 'Riders', href: '/riders', icon: UserCircle },
  { name: 'Passengers', href: '/passengers', icon: Users },
  { name: 'Cities', href: '/cities', icon: MapPin },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { name, email, role } = useSelector((state: RootState) => state.auth);
  const displayRole = role === 'super_admin' ? 'Super Admin' : 'Admin';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Get current page name for breadcrumb
  const currentPage = navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Dashboard';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-woosh-divider flex-shrink-0">
        <img src="/woosh_logo.png" alt="Woosh" className="h-7 w-auto" />
        <span className="ml-2.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-woosh-primary-light text-woosh-primary">
          {displayRole}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-woosh-primary text-white shadow-sm"
                    : "text-woosh-muted hover:text-woosh-dark hover:bg-woosh-surface"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      "transition-colors flex-shrink-0",
                      isActive ? "text-white" : "text-woosh-placeholder group-hover:text-woosh-dark"
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-woosh-divider p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <Avatar name={name || 'A'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-woosh-dark truncate">{name || 'Admin'}</p>
            <p className="text-xs text-woosh-muted truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-woosh-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-woosh-bg flex">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-woosh-border flex-col hidden lg:flex fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col animate-slide-in-left">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-woosh-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-woosh-muted hover:text-woosh-dark hover:bg-woosh-surface lg:hidden transition-colors"
            >
              <Menu size={20} />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-woosh-muted hidden sm:inline">Woosh Admin</span>
              <ChevronRight size={14} className="text-woosh-placeholder hidden sm:inline" />
              <span className="font-medium text-woosh-dark">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <img src="/woosh_logo.png" alt="Woosh" className="h-6 w-auto lg:hidden" />
            {/* Desktop profile */}
            <div className="hidden lg:flex items-center gap-2.5">
              <Avatar name={name || 'A'} size="sm" />
              <div>
                <p className="text-sm font-medium text-woosh-dark leading-none">{name || 'Admin'}</p>
                <p className="text-xs text-woosh-muted mt-0.5">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
