import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="pl-60 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
