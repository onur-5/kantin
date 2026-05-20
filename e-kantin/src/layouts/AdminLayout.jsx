import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { translations } from '../utils/translations';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
   const { user, logout } = useAuth();
  const { language, setLanguage, notifications } = useData();
  const t = translations[language] || translations['TR'];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Auth protection
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const navItems = [
    { path: '/admin', label: t.dashboard, icon: 'bi-speedometer2' },
    { path: '/admin/pos', label: t.pos || 'POS Ekranı', icon: 'bi-cart-fill text-warning' },
    { path: '/admin/students', label: t.students, icon: 'bi-people' },
    { path: '/admin/cards', label: t.cards, icon: 'bi-credit-card' },
    { path: '/admin/products', label: t.products, icon: 'bi-box-seam' },
    { path: '/admin/personeller', label: t.staff, icon: 'bi-person-badge-fill' },
    { path: '/admin/stok-takip', label: 'Stok Takip', icon: 'bi-box-seam-fill text-info' },
    { path: '/admin/notifications', label: 'Bildirimler', icon: 'bi-bell', count: unreadCount },
    { path: '/admin/reports', label: 'İstatistik & Analiz', icon: 'bi-graph-up-arrow' },

    { path: '/admin/settings', label: t.settings, icon: 'bi-gear' },
  ];

  return (
    <div className={`admin-layout d-flex flex-column min-vh-100 ${theme === 'corporate' ? 'corporate-theme' : ''}`} data-bs-theme={theme === 'dark' ? 'dark' : 'light'}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm px-3 py-2">
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-light d-lg-none me-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <i className="bi bi-list"></i>
          </button>
          <span className="navbar-brand fw-bold text-primary fs-4 mb-0">
            <i className="bi bi-shop me-2"></i>E-Kantin
          </span>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
          {/* Language Toggle */}
          <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden d-none d-sm-flex">
            <button className={`btn btn-outline-light ${language === 'TR' ? 'active bg-primary border-primary' : ''}`} onClick={() => setLanguage('TR')}>TR</button>
            <button className={`btn btn-outline-light ${language === 'EN' ? 'active bg-primary border-primary' : ''}`} onClick={() => setLanguage('EN')}>EN</button>
          </div>
          
          <div className="btn-group btn-group-sm">
            <button className={`btn btn-outline-light ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><i className="bi bi-sun"></i></button>
            <button className={`btn btn-outline-light ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><i className="bi bi-moon"></i></button>
          </div>

          {/* Bildirim Çanı */}
          <Link to="/admin/notifications" className="btn btn-outline-light btn-sm position-relative rounded-pill px-3">
            <i className="bi bi-bell-fill"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm">
                {unreadCount}
              </span>
            )}
          </Link>

          <button className="btn btn-danger btn-sm fw-bold rounded-pill px-2 px-md-3 shadow-sm" onClick={logout} title={t.logout}>
            <i className="bi bi-box-arrow-right"></i><span className="d-none d-md-inline ms-2">{t.logout}</span>
          </button>
        </div>
      </nav>

      <div className="d-flex flex-grow-1 position-relative">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="position-absolute w-100 h-100 bg-dark bg-opacity-50 z-2 d-lg-none" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <aside 
          className={`sidebar border-end shadow-sm flex-shrink-0 ${theme === 'light' ? 'bg-white' : 'bg-dark'} ${isSidebarOpen ? 'd-block position-absolute z-3 h-100' : 'd-none'} d-lg-block`} 
          style={{ width: '250px' }}
        >
          <div className="p-3">
            <ul className="nav flex-column gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/dashboard');
                return (
                  <li className="nav-item" key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`nav-link rounded-3 fw-medium d-flex align-items-center px-3 py-2 transition-all ${
                       isActive ? 'active bg-primary text-white shadow-md' : 'text-secondary hover-bg-light'
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <div>
                          <i className={`bi ${item.icon} me-3 fs-5`}></i>
                          {item.label}
                        </div>
                        {item.count > 0 && (
                          <span className="badge rounded-pill bg-danger small">{item.count}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow-1 p-4 overflow-auto bg-body-tertiary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
