import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export const StudentPortal = () => {
  const { 
    cards, products, students, wishes, setWishes, 
    transactions, announcements, favorites, setFavorites 
  } = useData();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  
  const [activeTab, setActiveTab] = useState('all'); 
  const [wishText, setWishText] = useState('');

  // 🛡️ GÜVENLİK: Kullanıcı yoksa giriş ekranına at
  useEffect(() => {
    if (!user) {
      navigate('/ogrenci-giris');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Veri eşleme (Admin testi veya normal öğrenci)
  const studentData = user?.role === 'admin' ? (students?.[0] || {}) : (user?.data || {});
  
  if (!studentData?.id && user?.role !== 'admin') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center p-5 bg-white shadow rounded-4">
          <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
          <h3>Kullanıcı Verisi Alınamadı</h3>
          <p className="text-muted">Lütfen tekrar giriş yapmayı deneyin.</p>
          <button className="btn btn-primary rounded-pill px-4" onClick={logout}>Giriş Ekranına Dön</button>
        </div>
      </div>
    );
  }

  const studentCard = studentData?.id ? (cards || []).find(c => String(c.studentId) === String(studentData.id)) : null;
  const myFavorites = studentData?.id ? (favorites || []).filter(f => String(f.studentId) === String(studentData.id)).map(f => f.barcode) : [];
  const myHistory = studentCard?.cardId ? (transactions || []).filter(t => String(t.cardId) === String(studentCard.cardId)) : [];



  const toggleFavorite = (barcode) => {
    const cleanBarcode = String(barcode);
    const isFav = myFavorites.includes(cleanBarcode);
    
    if (isFav) {
      // Çıkar: String karşılaştırması ile filtrele
      const updated = (favorites || []).filter(f => 
        !(String(f.studentId) === String(studentData.id) && String(f.barcode) === cleanBarcode)
      );
      setFavorites(updated);
    } else {
      // Ekle: Mevcut diziye yeni objeyi spread ile ekle
      setFavorites([...(favorites || []), { studentId: studentData.id, barcode: cleanBarcode }]);
    }
  };

  const submitWish = async (e) => {
    e.preventDefault();
    if (!wishText.trim()) return;
    try {
      const result = await setWishes([...(wishes || []), { 
        id: uuidv4(), 
        studentNo: studentData?.id || studentData?.studentNo || 'Bilinmiyor', 
        message: wishText, 
        date: new Date().toISOString() 
      }]);
      
      if (result?.error) {
        window.Swal.fire("Veritabanı Hatası", result.error, "error");
      } else {
        setWishText('');
        window.Swal.fire("Başarılı", "Talebiniz iletildi.", "success");
      }
    } catch (err) {
      window.Swal.fire("Sistem Hatası", err.message, "error");
    }
  };

  return (
    <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`} data-bs-theme={theme}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <span className="navbar-brand fw-bold"><i className="bi bi-mortarboard-fill me-2"></i>E-Kantin Portalı</span>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-light rounded-pill px-3 d-none d-md-flex align-items-center" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon'}-fill me-2`}></i>
              {theme === 'dark' ? 'Aydınlık' : 'Karanlık'}
            </button>
            <div className="bg-white bg-opacity-25 rounded-pill px-3 py-1 text-white small d-none d-md-block">
              {studentData?.name} {studentData?.surname}
            </div>
            <button onClick={logout} className="btn btn-danger btn-sm fw-bold rounded-pill px-3">Çıkış</button>
          </div>
        </div>
      </nav>

      {/* Duyurular */}
      {(announcements || []).length > 0 && (
        <div className="bg-warning text-dark py-2 border-bottom shadow-sm overflow-hidden">
          <marquee scrollamount="6" className="fw-bold">
            {(announcements || []).map(a => `🔥 ${a.message}`).join('    |    ')}
          </marquee>
        </div>
      )}

      <div className="container py-4 animate-fade-in">
        <div className="row g-4">
          {/* Dashboard Sol Kolon */}
          <div className="col-lg-4">
            <div className={`card border-0 shadow-sm rounded-4 p-4 text-center mb-4 ${theme === 'dark' ? 'bg-secondary bg-opacity-25' : 'bg-white'}`}>
              <div className="bg-primary text-white rounded-circle p-4 d-inline-block mb-3 shadow">
                <i className="bi bi-person-circle display-4"></i>
              </div>
              <h5 className="fw-bold mb-1">{studentData?.name} {studentData?.surname}</h5>
              <p className="text-muted small mb-3">No: {studentData?.id || studentData?.studentNo}</p>
              
              <div className="bg-primary text-white p-3 rounded-4 shadow mb-3">
                <h6 className="small opacity-75 mb-1 text-uppercase">Cüzdan Bakiyesi</h6>
                <h2 className="fw-bold mb-0">{Number(studentCard?.balance || 0).toLocaleString()} ₺</h2>
              </div>

              <div className="row g-2">
                <div className="col-12">
                  <div className={`p-2 rounded-3 h-100 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
                    <small className="d-block text-muted">Favoriler</small>
                    <span className="fw-bold text-danger">{myFavorites.length} Ürün</span>
                  </div>
                </div>
              </div>
            </div>

            {/* İstek Kutusu */}
            <div className={`card border-0 shadow-sm rounded-4 p-4 ${theme === 'dark' ? 'bg-secondary bg-opacity-25' : 'bg-white'}`}>
              <h6 className="fw-bold mb-3"><i className="bi bi-chat-heart text-danger me-2"></i>Kantine Ne Gelsin?</h6>
              <form onSubmit={submitWish}>
                <textarea className="form-control bg-light border-0 mb-3" rows="3" placeholder="Önerinizi buraya yazın..." value={wishText} onChange={e => setWishText(e.target.value)} required></textarea>
                <button className="btn btn-danger w-100 fw-bold py-2 rounded-pill shadow-sm">TALEBİ GÖNDER</button>
              </form>
            </div>
          </div>

          {/* Sağ Kolon İçerik Alanı */}
          <div className="col-lg-8">
            <div className={`card border-0 shadow-sm rounded-4 p-2 mb-4 d-flex flex-row gap-2 ${theme === 'dark' ? 'bg-secondary bg-opacity-25' : 'bg-white'}`}>
              <button className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${activeTab === 'all' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`} onClick={() => setActiveTab('all')}>Ürünler</button>
              <button className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${activeTab === 'favorites' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`} onClick={() => setActiveTab('favorites')}>Favoriler</button>
              <button className={`btn flex-grow-1 rounded-pill fw-bold py-2 ${activeTab === 'history' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`} onClick={() => setActiveTab('history')}>Harcamalar</button>
            </div>

            {activeTab !== 'history' ? (
              <div className="row g-3">
                {(products || [])
                  .filter(p => activeTab === 'all' || myFavorites.includes(p.barcode))
                  .map(p => {
                    const isFav = myFavorites.includes(p.barcode);
                    return (
                      <div key={p.barcode} className="col-md-6">
                        <div className={`card h-100 border-0 shadow-sm rounded-4 p-3 product-card transition-all position-relative ${theme === 'dark' ? 'bg-secondary bg-opacity-25' : 'bg-white'} ${p.stock <= 0 ? 'opacity-75' : ''}`}>
                          {p.stock <= 0 && (
                            <span className="badge bg-danger position-absolute top-0 start-0 m-3 shadow-sm rounded-pill z-1 px-3">TÜKENDİ</span>
                          )}
                          <button className="btn btn-link position-absolute top-0 end-0 p-3 text-danger border-0 shadow-none z-1" onClick={() => toggleFavorite(p.barcode)}>
                            <i className={`bi bi-heart${isFav ? '-fill' : ''} fs-5`}></i>
                          </button>
                          
                          <div className={`d-flex align-items-center gap-3 ${p.stock <= 0 ? 'mt-4 pt-2' : ''}`}>
                            <div className={`p-3 rounded-4 ${p.stock <= 0 ? 'bg-secondary bg-opacity-25 text-secondary' : 'bg-primary-subtle text-primary'}`}>
                              <i className="bi bi-box-seam fs-3"></i>
                            </div>
                            <div className="overflow-hidden flex-grow-1">
                              <h6 className="fw-bold mb-1 text-truncate">{p.name}</h6>
                              <div className="d-flex flex-wrap align-items-center gap-2">
                                {p.discountedPrice && p.discountedPrice < p.price ? (
                                  <div className="d-flex align-items-center">
                                    <del className="text-muted small me-2">{p.price} ₺</del>
                                    <span className="text-danger fw-bold fs-5">{p.discountedPrice.toFixed(2)} ₺</span>
                                  </div>
                                ) : (
                                  <span className="text-primary fw-bold fs-5">{p.price} ₺</span>
                                )}

                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="animate-fade-in">
                {myHistory.map(t => (
                  <div key={t.id} className={`card border-0 shadow-sm rounded-4 p-3 mb-3 ${theme === 'dark' ? 'bg-secondary bg-opacity-25' : 'bg-white'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="overflow-hidden me-3">
                        <div className="fw-bold mb-1 text-truncate">{(t?.items || []).map(i => i.name).join(', ')}</div>
                        <small className="text-muted">{t?.date ? new Date(t.date).toLocaleString() : 'Tarih Bilgisi Yok'}</small>
                      </div>
                      <div className="text-primary fw-bold fs-5 text-nowrap">{t.amount} ₺</div>
                    </div>
                  </div>
                ))}
                {myHistory.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-cart-x display-1 text-muted opacity-25"></i>
                    <p className="text-muted mt-3">Henüz bir harcama kaydınız bulunmuyor.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
