import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Cards } from './pages/Cards';
import { Products } from './pages/Products';
import { POS } from './pages/POS';
import { Settings } from './pages/Settings';
import { StudentLogin } from './pages/StudentLogin';
import { StudentRegister } from './pages/StudentRegister';
import { StudentPortal } from './pages/StudentPortal';
import { StaffManagement } from './pages/StaffManagement';
import { Landing } from './pages/Landing';
import { Reports } from './pages/Reports';

import NotificationsPage from './pages/NotificationsPage';
import StockTracking from './pages/StockTracking';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <Routes>
                {/* 1. ANA KAPI: Portal (Sidebar Yok, Tam Ekran) */}
                <Route path="/" element={<Landing />} />

                {/* 2. ÖĞRENCİ SİSTEMİ (Sidebar Yok, Tam Ekran) */}
                <Route path="/ogrenci-giris" element={<StudentLogin />} />
                <Route path="/ogrenci-kayit" element={<StudentRegister />} />
                <Route path="/student" element={<StudentPortal />} />

                {/* 3. YÖNETİM PANELİ (AdminLayout İçinde Sidebar İle Gösterilir) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="students" element={<Students />} />
                  <Route path="cards" element={<Cards />} />
                  <Route path="products" element={<Products />} />
                  {/* PERSONEL YÖNETİMİ: Kullanıcının istediği yol adı eklendi */}
                  <Route path="personeller" element={<StaffManagement />} />
                  <Route path="staff" element={<Navigate to="/admin/personeller" replace />} />
                   <Route path="reports" element={<Reports />} />

                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="stok-takip" element={<StockTracking />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                <Route path="/login" element={<Navigate to="/ogrenci-giris" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
