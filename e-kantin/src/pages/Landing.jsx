import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const Landing = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const { recordLogin } = useData();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const success = loginAdmin(adminUsername, adminPassword);
    if (success) {
      // 🛡️ GÜVENLİK: Yönetici girişini kaydet
      await recordLogin(adminUsername, 'Admin');
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="text-center mb-5 text-white">
              <i className="bi bi-shop display-1 mb-3"></i>
              <h1 className="fw-bold">E-Kantin Sistemine Hoş Geldiniz</h1>
              <p className="lead">Lütfen giriş yapmak istediğiniz paneli seçin</p>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-lg rounded-4 hover-scale cursor-pointer" onClick={() => navigate('/ogrenci-giris')}>
                  <div className="card-body text-center p-5">
                    <div className="bg-primary-subtle text-primary rounded-circle p-4 d-inline-block mb-4">
                      <i className="bi bi-mortarboard display-4"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Öğrenci Girişi</h4>
                    <p className="text-muted mb-0">Harcamalarınızı yönetin ve limit belirleyin.</p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-lg rounded-4 hover-scale cursor-pointer" onClick={() => setShowAdminLogin(true)}>
                  <div className="card-body text-center p-5">
                    <div className="bg-success-subtle text-success rounded-circle p-4 d-inline-block mb-4">
                      <i className="bi bi-shield-lock display-4"></i>
                    </div>
                    <h4 className="fw-bold mb-3">Admin Girişi</h4>
                    <p className="text-muted mb-0">Kantin yönetim paneli ve POS sistemi.</p>
                  </div>
                </div>
              </div>
            </div>

            {showAdminLogin && (
              <div className="card mt-4 border-0 shadow-lg rounded-4 animate-slide-up">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3 text-center">Yönetici Girişi</h5>
                  <form onSubmit={handleAdminSubmit}>
                    <div className="mb-3">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Kullanıcı Adı"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Şifre"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button className="btn btn-success w-100 fw-bold" type="submit">Giriş Yap</button>
                  </form>
                  <div className="text-center">
                    <button className="btn btn-link text-muted btn-sm" onClick={() => setShowAdminLogin(false)}>Vazgeç</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .hover-scale { transition: transform 0.2s; }
        .hover-scale:hover { transform: scale(1.05); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};
