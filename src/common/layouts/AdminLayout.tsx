import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, UserCircle, Map, Settings,
  MapPin, ShieldAlert, FileText, Shield, Banknote, TrendingUp, MessageSquare
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { RootState } from '../../app/store';

const navigationGroups = [
  {
    title: 'LIVE OPERATIONS',
    items: [
      { name: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Live Rides', href: '/rides', icon: Map, badge: 14 },
      { name: 'SOS & Safety', href: '/sos', icon: ShieldAlert, badge: 1, badgeColor: 'bg-red-500' },
      { name: 'Support Inbox', href: '/support', icon: MessageSquare, badge: 6, badgeColor: 'bg-woosh-sidebar-hover' },
    ]
  },
  {
    title: 'PEOPLE',
    items: [
      { name: 'Rider Verification', href: '/riders/verification', icon: Shield, badge: 4, badgeColor: 'bg-orange-500' },
      { name: 'Riders', href: '/riders', icon: UserCircle },
      { name: 'Passengers', href: '/passengers', icon: Users },
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { name: 'Ride History', href: '/ride-history', icon: MapPin },
      { name: 'Disputes', href: '/disputes', icon: FileText },
      { name: 'Payouts', href: '/payouts', icon: Banknote },
      { name: 'Insurance', href: '/insurance', icon: Shield },
      { name: 'Cities, Zones & Fares', href: '/cities', icon: MapPin },
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { name: 'Analytics', href: '/analytics', icon: TrendingUp },
      { name: 'Audit Log', href: '/audit-log', icon: FileText },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Broadcasts', href: '/broadcasts', icon: MessageSquare },
      { name: 'Admins & Roles', href: '/admins', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { name, role } = useSelector((state: RootState) => state.auth);
  const displayRole = role === 'super_admin' ? 'Super Admin' : 'Admin';

  // Get current page name for breadcrumb
  const allNavItems = navigationGroups.flatMap(g => g.items);
  const currentPage = allNavItems.find(n => location.pathname.startsWith(n.href))?.name || 'Command Center';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-woosh-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-lg mr-3 shadow-sm">
          <img className='object-cover' src="/favicon.png" alt="" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-[15px] leading-none">Woosh Admin</span>
          <span className="text-woosh-primary text-[10px] uppercase font-bold tracking-widest mt-0.5">{displayRole}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-xs font-bold text-woosh-sidebar-muted tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-woosh-primary text-white"
                          : "text-woosh-sidebar-muted hover:text-white hover:bg-woosh-sidebar-hover"
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
                            isActive ? "text-white" : "text-woosh-sidebar-muted group-hover:text-white"
                          )}
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full text-white min-w-[20px] text-center",
                            item.badgeColor || (isActive ? 'bg-black/20' : 'bg-woosh-sidebar-hover group-hover:bg-woosh-sidebar-border')
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

      {/* User Section */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-woosh-sidebar-hover flex items-center justify-center text-white font-medium border border-woosh-sidebar-border">
              {name ? name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-woosh-sidebar-bg rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{name || 'Super Admin'}</p>
            <p className="text-xs text-woosh-sidebar-muted truncate">On duty · since 6:00 pm</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-woosh-bg flex">
      {/* Desktop Sidebar */}
      <aside className="w-[240px] bg-woosh-sidebar-bg border-r border-woosh-sidebar-border flex-col hidden lg:flex fixed inset-y-0 left-0 z-30">
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px]">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-woosh-border flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-woosh-dark">{currentPage}</h1>
            <p className="text-xs text-woosh-muted">Bhopal · Thu, 8 Oct · 10:25 pm</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search ride ID, phone or name"
                className="pl-9 pr-8 py-2 w-64 bg-woosh-surface border border-woosh-border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-woosh-primary"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-woosh-placeholder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-woosh-placeholder border border-woosh-border rounded px-1">/</span>
            </div>
            
            {/* Active SOS Button */}
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              1 active SOS
            </button>
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
