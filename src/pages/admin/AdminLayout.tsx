import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Package as PackageIcon, 
  Layers, 
  Settings, 
  ChevronRight, 
  LayoutDashboard,
  Menu as MenuIcon,
  Users,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const expectedAdmins = [
    'minhpham.tst@gmail.com',
    'minhpham.tst+admin@gmail.com',
    'hongquannguyen.1206@gmail.com',
    'hongquannguyen.1206+admin@gmail.com',
    'admin@smartdata.vn'
  ];
  const isSuperAdmin = expectedAdmins.includes(user?.email || '');

  const menuItems = [
    { name: 'Đơn SIM', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Gói cước', path: '/admin', icon: <PackageIcon className="w-5 h-5" /> },
    { name: 'Danh mục', path: '/admin/categories', icon: <Layers className="w-5 h-5" /> },
    { name: 'Menu', path: '/admin/menus', icon: <MenuIcon className="w-5 h-5" /> },
    { name: 'Cấu hình trang', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
    ...(isSuperAdmin ? [{ name: 'Quản trị viên', path: '/admin/admins', icon: <Users className="w-5 h-5" /> }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden lg:flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Management</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === item.path 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.name}</span>
                {location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t font-medium text-xs text-slate-400">
          Logged in as {user.email}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
