import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, UserCircle, Map, Settings,
  MapPin, ShieldAlert, FileText, Shield, Banknote, TrendingUp, MessageSquare, LogOut, Search, Menu, X, CheckCircle,
  Radio, Megaphone, ChevronLeft, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { RootState, AppDispatch } from '../../app/store';
import { logout } from '../../modules/auth/store/authSlice';
import { apiClient } from '../utils/apiClient';

interface SidebarContentProps {
  collapsed: boolean;
  isMobile?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('woosh_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('woosh_sidebar_collapsed', String(next));
      } catch {
        // silent fallback
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const SidebarContent = ({ collapsed, isMobile, onToggleCollapse, onClose }: SidebarContentProps) => (
    <div className="flex flex-col h-full bg-[#111827] text-gray-200 select-none">
      {/* Sidebar Header & Brand Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-gray-800/80 flex-shrink-0 transition-all duration-300",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {collapsed ? (
          <Link
            to="/dashboard"
            title="Woosh Command Center"
            className="flex items-center justify-center p-1.5 rounded-xl hover:bg-gray-800/80 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center p-2 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <img src="/favicon.svg" alt="Woosh" className="w-full h-full object-contain" />
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-between w-full min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 group py-1">
              <img
                src="/woosh_logo.png"
                alt="Woosh"
                className="h-7 w-auto max-w-[130px] object-contain drop-shadow transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                }}
              />
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase tracking-wide flex-shrink-0">
                Admin
              </span>
            </Link>

            {/* Desktop Collapse Arrow Button */}
            {!isMobile && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar (Ctrl+B)"
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition items-center justify-center flex-shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-3 scrollbar-thin transition-all duration-300",
        collapsed ? "px-2 space-y-4" : "px-3 space-y-5"
      )}>
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {collapsed ? (
              <div className="px-1 py-1">
                <div className="h-px bg-gray-800/80 rounded" />
              </div>
            ) : (
              <h3 className="px-3 text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 uppercase">
                {group.title}
              </h3>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasBadge = item.badge !== undefined && item.badge > 0;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    title={collapsed ? `${item.name}${hasBadge ? ` (${item.badge})` : ''}` : undefined}
                    onClick={() => {
                      if (isMobile && onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center rounded-xl text-sm font-medium transition-all group",
                        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-woosh-primary text-white shadow-md shadow-pink-600/30 font-semibold"
                          : "text-gray-300 hover:text-white hover:bg-gray-800/80"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="relative flex items-center justify-center flex-shrink-0">
                          <Icon
                            size={19}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={cn(
                              "transition-colors",
                              isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                            )}
                          />
                          {/* Badge indicator on collapsed view */}
                          {collapsed && hasBadge && (
                            <span
                              className={cn(
                                "absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 text-[9px] font-black rounded-full text-white flex items-center justify-center ring-2 ring-[#111827] shadow-sm animate-pulse",
                                item.badgeColor || (isActive ? 'bg-black/60' : 'bg-pink-600')
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Text and Badge on expanded view */}
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.name}</span>
                            {hasBadge && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full text-white min-w-[20px] text-center shadow-xs",
                                  item.badgeColor || (isActive ? 'bg-black/30' : 'bg-gray-700')
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Floating tooltip on hover when collapsed */}
                        {collapsed && (
                          <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center z-50">
                            <div className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-gray-700 whitespace-nowrap flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {hasBadge && (
                                <span className={cn(
                                  "text-[9px] font-black px-1.5 py-0.2 rounded-full text-white",
                                  item.badgeColor || "bg-pink-600"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
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
      <div className={cn(
        "border-t border-gray-800/80 flex-shrink-0 bg-gray-900/60 transition-all duration-300",
        collapsed ? "p-2.5 flex flex-col items-center gap-2" : "p-3.5"
      )}>
        {collapsed ? (
          <>
            <div className="relative group cursor-pointer" title={`${name || 'Admin'} (${displayRole})`}>
              <div className="w-9 h-9 rounded-full bg-woosh-primary/20 text-woosh-primary font-bold flex items-center justify-center border border-woosh-primary/30 text-sm shadow-sm">
                {name ? name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#111827] rounded-full"></div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-woosh-primary/20 text-woosh-primary font-bold flex items-center justify-center border border-woosh-primary/30 text-sm">
                  {name ? name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{name || 'Admin User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{displayRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar (Collapsible) */}
      <aside className={cn(
        "bg-[#111827] border-r border-gray-800/80 flex-col hidden lg:flex fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[76px]" : "w-[260px]"
      )}>
        <SidebarContent
          collapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[#111827] shadow-2xl flex flex-col z-50">
            <SidebarContent
              collapsed={false}
              isMobile
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
      )}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Collapse / Expand Toggle Button in Topbar */}
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className="hidden lg:flex p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition items-center justify-center"
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>

            <div className="flex flex-col">
              <h1 className="text-base lg:text-lg font-bold text-gray-900 leading-tight">{currentPage}</h1>
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

