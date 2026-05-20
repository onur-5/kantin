import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const StudentLogin = () => {
  const { students, recordLogin } = useData();
  const showToast = useToast();
  const { loginStudent } = useAuth();
  const [studentNo, setStudentNo] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = students.find(s => s.id === studentNo && s.password === password);

    if (user) {
      // 🛡️ GÜVENLİK: Önce giriş işlemini kaydet (yönlendirmeden önce)
      await recordLogin(`${user.name} ${user.surname || ''}`, 'Student');
      
      loginStudent(user);
      showToast(`Hoş geldiniz, ${user.name}!`, 'success');
    } else {
      showToast("Hatalı numara veya şifre!", 'danger');
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 animate-fade-in">
              <div className="text-center mb-4">
                <i className="bi bi-mortarboard-fill display-4 text-primary"></i>
                <h2 className="fw-bold mt-3">Öğrenci Girişi</h2>
                <p className="text-muted">Kantin hesabınıza erişin</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="small fw-bold mb-1">Öğrenci Numarası</label>
                  <input 
                    type="text" 
                    className="form-control rounded-pill px-3" 
                    placeholder="Örn: 2023001"
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="small fw-bold mb-1">Şifre</label>
                  <input 
                    type="password" 
                    className="form-control rounded-pill px-3" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow">
                  GİRİŞ YAP
                </button>
              </form>
              <div className="mt-4 text-center">
                <a href="/" className="text-decoration-none text-muted small">← Ana Sayfaya Dön</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
