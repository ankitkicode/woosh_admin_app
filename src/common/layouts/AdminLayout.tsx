import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, UserCircle, Map, Settings,
  MapPin, ShieldAlert, FileText, Shield, Banknote, TrendingUp, MessageSquare, LogOut, Search, Menu, X, CheckCircle,
  Radio, Megaphone
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { RootState, AppDispatch } from '../../app/store';
import { logout } from '../../modules/auth/store/authSlice';
import { apiClient } from '../utils/apiClient';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [badges, setBadges] = useState<{
    activeRides: number;
    activeSOS: number;
    openTickets: number;
    pendingKYC: number;
    openDisputes: number;
  }>({
    activeRides: 0,
    activeSOS: 0,
    openTickets: 0,
    pendingKYC: 0,
    openDisputes: 0,
  });

  const { name, role } = useSelector((state: RootState) => state.auth);
  const displayRole = role === 'super_admin' ? 'Super Admin' : 'Admin';

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      setCurrentTime(now.toLocaleString('en-IN', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real badges from dashboard API
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await apiClient('/admin/dashboard').catch(() => null);
        const data = res?.data || res || {};
        setBadges({
          activeRides: data.activeRides || 0,
          activeSOS: data.activeSOS || 0,
          openTickets: data.openSupportTickets || 0,
          pendingKYC: data.pendingKYC || 0,
          openDisputes: data.openComplaints || 0,
        });
      } catch (e) {
        // quiet fallback
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/rides?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navigationGroups = [
    {
      title: 'LIVE OPERATIONS',
      items: [
        { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Live GPS Radar', href: '/tracking', icon: Radio },
        { name: 'Live Rides', href: '/rides', icon: Map, badge: badges.activeRides > 0 ? badges.activeRides : undefined },
        { name: 'SOS & Safety', href: '/sos', icon: ShieldAlert, badge: badges.activeSOS > 0 ? badges.activeSOS : undefined, badgeColor: 'bg-red-600' },
        { name: 'Support Inbox', href: '/support', icon: MessageSquare, badge: badges.openTickets > 0 ? badges.openTickets : undefined, badgeColor: 'bg-blue-600' },
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { name: 'Riders Fleet', href: '/riders', icon: UserCircle, badge: badges.pendingKYC > 0 ? badges.pendingKYC : undefined, badgeColor: 'bg-amber-500' },
        { name: 'Passengers', href: '/passengers', icon: Users },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { name: 'Disputes', href: '/disputes', icon: FileText, badge: badges.openDisputes > 0 ? badges.openDisputes : undefined, badgeColor: 'bg-orange-500' },
        { name: 'Payouts', href: '/payouts', icon: Banknote },
        { name: 'Insurance Claims', href: '/insurance', icon: Shield },
        { name: 'Cities & Fares', href: '/cities', icon: MapPin },
      ]
    },
    {
      title: 'INSIGHTS & SYSTEM',
      items: [
        { name: 'Push & Broadcasts', href: '/broadcasts', icon: Megaphone },
        { name: 'Analytics', href: '/analytics', icon: TrendingUp },
        { name: 'Admins & Team', href: '/admins', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  // Breadcrumb current page title
  const allNavItems = navigationGroups.flatMap(g => g.items);
  const matchedNav = allNavItems.find(n => location.pathname === n.href || (n.href !== '/dashboard' && location.pathname.startsWith(n.href)));
  const currentPage = matchedNav?.name || 'Admin Panel';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#111827] text-gray-200">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-woosh-primary flex items-center justify-center font-bold text-white shadow">
            <span className="text-lg">W</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-[15px] leading-tight tracking-wide">Woosh Admin</span>
            <span className="text-woosh-primary text-[10px] uppercase font-bold tracking-widest">{displayRole}</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                        isActive
                          ? "bg-woosh-primary text-white shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-gray-800"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={cn(
                            "transition-colors flex-shrink-0",
                            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                          )}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge !== undefined && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full text-white min-w-[20px] text-center",
                            item.badgeColor || (isActive ? 'bg-black/30' : 'bg-gray-700')
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0 bg-gray-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-woosh-primary/20 text-woosh-primary font-bold flex items-center justify-center border border-woosh-primary/30">
                {name ? name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition flex-shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-[240px] bg-[#111827] border-r border-gray-800 flex-col hidden lg:flex fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#111827] shadow-2xl flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px]">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">{currentPage}</h1>
              <p className="text-xs text-gray-500 font-medium">Bhopal HQ · {currentTime || 'Live Status'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Quick Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ride ID, rider or user..."
                className="pl-9 pr-8 py-2 w-64 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-woosh-primary focus:bg-white transition"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={14} />
              </span>
            </form>

            {/* Active SOS Button */}
            {badges.activeSOS > 0 ? (
              <button
                onClick={() => navigate('/sos')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm animate-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-white"></div>
                {badges.activeSOS} Active SOS
              </button>
            ) : (
              <button
                onClick={() => navigate('/sos')}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold transition"
              >
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">Fleet Safe</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

