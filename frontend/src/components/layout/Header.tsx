import { Bell, Search, User, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/help': 'Help',
};

export function Header({ title, subtitle }: HeaderProps) {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/' }];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const name = routeNames[currentPath] || path;
      breadcrumbs.push({ name, path: currentPath });
    });
    
    return breadcrumbs.length > 1 ? breadcrumbs : [];
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = title || routeNames[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Breadcrumb o Título */}
        <div className="flex items-center gap-3">
          {breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-gray-900">{crumb.name}</span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            <div>
              <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right side: Search, Notifications, User */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs, companies..."
              className="w-80 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
