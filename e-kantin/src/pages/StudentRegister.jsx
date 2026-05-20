import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export const StudentRegister = () => {
  const { students, setStudents, staff, setStaff } = useData();
  const showToast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [studentNo, setStudentNo] = useState('');
  const [password, setPassword] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [userType, setUserType] = useState(''); // 'student' veya 'staff'

  const handleVerify = (e) => {
    e.preventDefault();
    const cleanNo = studentNo.trim();
    
    // Hem öğrencileri hem personelleri kontrol et
    const student = (students || []).find(s => String(s.id) === cleanNo || String(s.studentNo) === cleanNo);
    const person = (staff || []).find(s => String(s.id) === cleanNo);

    const user = student || person;

    if (!user) {
      showToast("Numara bulunamadı! Lütfen kantin görevlisine başvurarak kaydınızı yaptırın.", 'danger');
      return;
    }

    // Şifre Durumu Kontrolü
    const hasPassword = user.password && user.password !== '123' && user.password !== '';

    if (hasPassword) {
      showToast("Bu numara için zaten bir şifre mevcut. Lütfen giriş yapın.", 'warning');
      navigate('/ogrenci-giris');
      return;
    }

    // Şifre boşsa veya tanımsızsa şifre belirleme adımına geç
    setVerifiedUser(user);
    setUserType(student ? 'student' : 'staff');
    setStep(2);
    showToast("Hesap doğrulandı. Lütfen yeni şifrenizi belirleyin.", 'success');
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (password.length < 4) {
      showToast("Şifre en az 4 karakter olmalıdır.", 'warning');
      return;
    }

    if (userType === 'student') {
      const updated = students.map(s => String(s.id) === String(verifiedUser.id) ? { ...s, password: password } : s);
      setStudents(updated);
    } else {
      const updated = staff.map(s => String(s.id) === String(verifiedUser.id) ? { ...s, password: password } : s);
      setStaff(updated);
    }

    showToast("Şifreniz kaydedildi! Giriş yapabilirsiniz.", 'success');
    navigate('/ogrenci-giris');
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="text-center mb-4">
              <i className="bi bi-shield-lock display-1 text-white"></i>
              <h2 className="mt-3 text-white fw-bold">Şifre Aktivasyonu</h2>
              <p className="text-white opacity-75">Numaranızı doğrulayın ve şifrenizi oluşturun</p>
            </div>
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="card-body p-5">
                {step === 1 ? (
                  <form onSubmit={handleVerify}>
                    <div className="mb-4">
                      <label className="form-label fw-bold">Öğrenci / Sicil No</label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="Size verilen numara..."
                        value={studentNo}
                        onChange={(e) => setStudentNo(e.target.value)}
                        required 
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill shadow mb-3 fw-bold">
                      HESABI DOĞRULA
                    </button>
                    <div className="text-center mt-3">
                      <Link to="/ogrenci-giris" className="text-decoration-none fw-bold small">Zaten şifrem var, Giriş Yap</Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSetPassword}>
                    <div className="alert alert-info border-0 rounded-4 mb-4">
                      <h6 className="fw-bold mb-1">Merhaba, {verifiedUser?.name}!</h6>
                      <p className="small mb-0 opacity-75">Numaranız doğrulandı. Lütfen 4 haneli bir şifre belirleyin.</p>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold">Yeni Şifreniz</label>
                      <input 
                        type="password" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="btn btn-success w-100 py-3 rounded-pill shadow mb-3 fw-bold">
                      ŞİFREYİ KAYDET VE TAMAMLA
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
