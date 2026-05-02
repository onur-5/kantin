import { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../utils/translations';
import { v4 as uuidv4 } from 'uuid';

export const Settings = () => {
  const { 
    announcements, setAnnouncements, setWishes, wishes,
    backupData, restoreData, language, setLanguage, resetAllData 
  } = useData();
  const { theme, setTheme } = useTheme();
  const t = translations[language];
  const showToast = useToast();
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const fileInputRef = useRef(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setAnnouncements([...(announcements || []), {
      id: uuidv4(),
      message: newAnnouncement,
      date: new Date().toISOString()
    }]);
    setNewAnnouncement('');
    showToast(language === 'TR' ? 'Duyuru yayınlandı.' : 'Announcement published.', 'success');
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await restoreData(file);
      showToast(language === 'TR' ? 'Veriler başarıyla yüklendi!' : 'Data restored successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(language === 'TR' ? 'Hatalı dosya formatı!' : 'Invalid file format!', 'danger');
    }
  };

  return (
    <div className="container-fluid animate-fade-in py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">{t.settings}</h2>
      </div>
      
      <div className="row g-4">
        {/* THEME & LANGUAGE */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-4"><i className="bi bi-palette me-2 text-primary"></i>Görünüm ve Dil</h5>
            
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-3">TEMA SEÇİMİ</label>
              <div className="row g-2">
                <div className="col-4">
                  <button className={`btn w-100 py-3 rounded-4 border-2 ${theme === 'light' ? 'btn-primary border-primary' : 'btn-outline-secondary border-light-subtle'}`} onClick={() => setTheme('light')}>
                    <i className="bi bi-sun fs-4 d-block"></i>Açık
                  </button>
                </div>
                <div className="col-4">
                  <button className={`btn w-100 py-3 rounded-4 border-2 ${theme === 'dark' ? 'btn-primary border-primary' : 'btn-outline-secondary border-light-subtle'}`} onClick={() => setTheme('dark')}>
                    <i className="bi bi-moon fs-4 d-block"></i>Koyu
                  </button>
                </div>
                <div className="col-4">
                  <button className={`btn w-100 py-3 rounded-4 border-2 ${theme === 'corporate' ? 'btn-warning border-warning' : 'btn-outline-secondary border-light-subtle'}`} onClick={() => setTheme('corporate')}>
                    <i className="bi bi-bank fs-4 d-block"></i>Kurumsal
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-0">
              <label className="form-label small fw-bold text-muted mb-3">SİSTEM DİLİ</label>
              <div className="d-flex gap-2">
                <button className={`btn flex-grow-1 py-2 rounded-pill fw-bold ${language === 'TR' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setLanguage('TR')}>TURKISH (TR)</button>
                <button className={`btn flex-grow-1 py-2 rounded-pill fw-bold ${language === 'EN' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setLanguage('EN')}>ENGLISH (EN)</button>
              </div>
            </div>
          </div>
        </div>

        {/* BACKUP & RESTORE */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-info-subtle">
            <h5 className="fw-bold mb-4 text-info"><i className="bi bi-shield-lock me-2"></i>Veri Güvenliği</h5>
            <p className="small text-info-emphasis mb-4">Sistemdeki tüm verileri yerel bilgisayarınıza yedekleyebilir veya daha önce aldığınız bir yedeği sisteme yükleyebilirsiniz.</p>
            <div className="d-grid gap-3">
              <button className="btn btn-info text-white fw-bold py-3 rounded-pill shadow-sm" onClick={backupData}>
                <i className="bi bi-cloud-arrow-down me-2"></i>{t.backup}
              </button>
              <button className="btn btn-white border-info text-info fw-bold py-3 rounded-pill shadow-sm" onClick={() => fileInputRef.current.click()}>
                <i className="bi bi-cloud-arrow-up me-2"></i>{t.restore}
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleRestore} />
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT SYSTEM */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4 text-warning"><i className="bi bi-megaphone me-2"></i>Duyuru Yönetimi</h5>
            <form onSubmit={handleAdd}>
              <textarea className="form-control border-0 bg-light mb-3 p-3 rounded-4" rows="3" placeholder="Yeni duyuru metni..." value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} required></textarea>
              <button className="btn btn-warning w-100 fw-bold py-3 rounded-pill shadow-sm text-dark">YAYINLA</button>
            </form>
          </div>
        </div>

        {/* WISH LIST */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 overflow-hidden">
            <h5 className="fw-bold mb-4 text-danger"><i className="bi bi-chat-heart me-2"></i>Talepler</h5>
            <div className="overflow-auto" style={{ maxHeight: '300px' }}>
              {(wishes || []).length > 0 ? wishes.map(w => (
                <div key={w.id} className="p-3 mb-3 bg-light rounded-4 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold small mb-1">No: {w.studentNo}</div>
                    <div className="text-muted small">{w.message}</div>
                  </div>
                  <button className="btn btn-sm text-danger" onClick={() => setWishes(wishes.filter(x => x.id !== w.id))}><i className="bi bi-trash"></i></button>
                </div>
              )) : <div className="text-center py-5 text-muted">Talep bulunmuyor.</div>}
            </div>
          </div>
        </div>

        {/* SYSTEM RESET */}
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm rounded-4 p-4 border-danger bg-danger bg-opacity-10 mt-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="fw-bold text-danger mb-2"><i className="bi bi-exclamation-octagon-fill me-2"></i>SİSTEMİ SIFIRLA</h5>
                <p className="text-danger small mb-0 fw-medium">Tüm ürünler, öğrenciler, personeller, harcama geçmişi ve bildirimler kalıcı olarak silinecektir. Bu işlem geri alınamaz!</p>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <button className="btn btn-danger fw-bold rounded-pill px-4 py-2 shadow" onClick={async () => {
                  const pass = prompt("Sistemi sıfırlamak için onay şifresini girin (Şifre: 12345):");
                  if (pass && pass.trim() === "12345") {
                    if (confirm("Tüm veriler kalıcı olarak silinecek. Onaylıyor musunuz?")) {
                      const res = await resetAllData();
                      if (res.success) {
                        alert("Sistem başarıyla sıfırlandı.");
                        window.location.reload();
                      } else {
                        alert("Hata: " + res.message);
                      }
                    }
                  } else if (pass !== null) {
                    alert("Hatalı şifre!");
                  }
                }}>
                  FABRİKA AYARLARINA DÖN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
