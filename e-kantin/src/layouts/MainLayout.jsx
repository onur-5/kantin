import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Package, Settings, Gamepad2, Bell } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Anasayfa', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Öğrenci İşlemleri', path: '/members', icon: <Users size={20} /> },
    { name: 'Kart İşlemleri', path: '/cards', icon: <CreditCard size={20} /> },
    { name: 'Ürün İşlemleri', path: '/products', icon: <Package size={20} /> },
    { name: 'Ayarlar', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-brand-dark text-white min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <Gamepad2 size={28} />
        <span className="text-xl font-bold tracking-wider">System</span>
      </div>
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-white/15 font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 text-xs text-center text-white/50 border-t border-white/10">
        Sürüm: 1.0.3
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-end px-8 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold text-sm">
          A
        </div>
      </div>
    </header>
  );
};

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-brand-light font-sans text-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
