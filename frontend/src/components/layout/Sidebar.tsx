import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, BarChart3, Zap, ChevronLeft, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
  { name: 'Jobs', href: '/jobs', icon: Briefcase, badge: '12' },
  { name: 'Applications', href: '/applications', icon: FileText, badge: null },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-base font-bold">JobAutomation</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors relative',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Separator */}
      <div className="mx-3 my-2 border-t border-slate-800" />

      {/* Secondary Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {secondaryNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
          {!isCollapsed && <span>Collapse</span>}
        </button>

        {/* Version */}
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}
