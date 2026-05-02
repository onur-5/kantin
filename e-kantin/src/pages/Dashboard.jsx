import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { translations } from '../utils/translations';
import { useToast } from '../context/ToastContext';

export const Dashboard = () => {
  const { 
    language, transactions, products, students, staff, favorites, cards, wishes, applyDiscount, removeDiscount
  } = useData();
  const t = translations[language] || translations['TR'];
  const showToast = useToast();
  const [discountPercent, setDiscountPercent] = useState(10);

  // --- VERİ ANALİZİ ---
  const totalUsers = (students?.length || 0) + (staff?.length || 0);
  const criticalItems = (products || []).filter(p => p.stock < (p.threshold || 10));
  const today = new Date().toISOString().split('T')[0];
  const todaySales = (transactions || []).filter(tr => tr?.date?.startsWith(today)).reduce((sum, tr) => sum + (Number(tr?.amount) || 0), 0);

  // DURGUN STOK ANALİZİ
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const unsoldProducts = products.filter(p => {
    const hasSales = transactions.some(t => 
      new Date(t.date) > sevenDaysAgo && 
      t.items?.some(item => String(item.barcode) === String(p.barcode))
    );
    return !hasSales && p.stock > 0;
  }).slice(0, 5); // Daha sade olması için ilk 5 ürünü göster

  // EN ÇOK HARCAMA YAPANLAR (Top 5)
  const userSpendings = (transactions || []).reduce((acc, tr) => {
    const card = (cards || []).find(c => String(c.cardId) === String(tr.cardId));
    if (!card) return acc;
    acc[card.studentId] = (acc[card.studentId] || 0) + (Number(tr.amount) || 0);
    return acc;
  }, {});

  const topSpenders = Object.entries(userSpendings)
    .map(([id, amount]) => {
      const user = [...(students || []), ...(staff || [])].find(u => String(u.id) === String(id));
      return { name: user ? `${user.name} ${user.surname}` : `ID: ${id}`, amount };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // POPÜLER ÜRÜNLER
  const favoriteCounts = (favorites || []).reduce((acc, f) => {
    acc[f.barcode] = (acc[f.barcode] || 0) + 1;
    return acc;
  }, {});

  const popularProducts = Object.entries(favoriteCounts)
    .map(([barcode, count]) => {
      const product = (products || []).find(p => String(p.barcode) === String(barcode));
      return { ...product, favCount: count };
    })
    .filter(p => p.name && p.favCount > 0)
    .sort((a, b) => b.favCount - a.favCount).slice(0, 5);

  const handleApplyDiscount = (barcode, name) => {
    applyDiscount(barcode, discountPercent);
    showToast(`${name} ürününe %${discountPercent} indirim uygulandı!`, "success");
  };

  return (
    <div className="container-fluid py-4 animate-fade-in">
      {/* ÜST ÖZET KARTLARI */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white h-100">
            <small className="text-uppercase fw-bold opacity-75">{t.dailySales}</small>
            <h2 className="fw-bold mb-0 mt-2">{todaySales.toLocaleString()} ₺</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white h-100">
            <small className="text-uppercase fw-bold opacity-75">Öğrenci Sayısı</small>
            <h2 className="fw-bold mb-0 mt-2">{students?.length || 0}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-secondary text-white h-100">
            <small className="text-uppercase fw-bold opacity-75">Personel Sayısı</small>
            <h2 className="fw-bold mb-0 mt-2">{staff?.length || 0}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-info text-white h-100">
            <small className="text-uppercase fw-bold opacity-75">Kritik Stok</small>
            <h2 className="fw-bold mb-0 mt-2">{criticalItems.length} Ürün</h2>
            <div className="mt-auto pt-2 small opacity-75">Stok Takip sayfasından yönetin →</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* EN ÇOK HARCAMA YAPANLAR */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold"><i className="bi bi-star-fill text-warning me-2"></i>En Çok Harcayanlar</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="small text-muted">
                  <tr><th className="ps-3">Kullanıcı</th><th className="text-end pe-3">Toplam</th></tr>
                </thead>
                <tbody>
                  {topSpenders.map((user, idx) => (
                    <tr key={idx}>
                      <td className="ps-3 py-2 fw-bold small text-truncate" style={{ maxWidth: '120px' }}>{user.name}</td>
                      <td className="text-end pe-3 fw-bold text-primary small">{user.amount.toLocaleString()} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* POPÜLER ÜRÜNLER */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header border-0 py-3">
              <h6 className="mb-0 fw-bold"><i className="bi bi-heart-fill text-danger me-2"></i>Öğrenci Favorileri</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="small text-muted">
                  <tr><th className="ps-3">Ürün</th><th className="text-end pe-3">İlgi</th></tr>
                </thead>
                <tbody>
                  {popularProducts.map(p => (
                    <tr key={p.barcode}>
                      <td className="ps-3 py-2 fw-bold small">{p.name}</td>
                      <td className="text-end pe-3"><span className="badge bg-danger-subtle text-danger rounded-pill small">{p.favCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SON TALEPLER */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header border-0 py-3">
              <h6 className="mb-0 fw-bold"><i className="bi bi-chat-left-text-fill text-info me-2"></i>Son Talepler</h6>
            </div>
            <div className="p-3 overflow-auto" style={{ maxHeight: '250px' }}>
              {(wishes || []).slice(0, 5).map(w => (
                <div key={w.id} className="mb-2 p-2 bg-light rounded-3 small">
                  <div className="fw-bold text-primary">No: {w.studentNo}</div>
                  <div className="text-muted">{w.message}</div>
                </div>
              ))}
              {(!wishes || wishes.length === 0) && (
                <div className="text-center py-4 text-muted small">Henüz talep yok.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DURGUN STOK İNDİRİM PANELİ (Kompakt Tasarım) */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-warning p-3 border-0 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold"><i className="bi bi-tag-fill me-2"></i>Durgun Stok İndirim Paneli</h6>
              <div className="d-flex align-items-center gap-2">
                <input 
                  type="number" 
                  className="form-control form-control-sm rounded-pill text-center fw-bold" 
                  style={{ width: '60px' }} 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
                <span className="small fw-bold">% İndirim</span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="x-small text-muted">
                    <tr>
                      <th className="ps-4">Satılmayan Ürün</th>
                      <th>Fiyat</th>
                      <th>Stok</th>
                      <th className="pe-4 text-end">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unsoldProducts.map(p => (
                      <tr key={p.barcode}>
                        <td className="ps-4 py-2 fw-bold small">{p.name}</td>
                        <td className="small">{p.price.toFixed(2)} ₺</td>
                        <td className="small">{p.stock}</td>
                        <td className="pe-4 text-end">
                          <button 
                            className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${p.discountedPrice ? 'btn-outline-danger' : 'btn-dark'}`} 
                            style={{ fontSize: '10px' }}
                            onClick={() => p.discountedPrice ? removeDiscount(p.barcode) : handleApplyDiscount(p.barcode, p.name)}
                          >
                            {p.discountedPrice ? 'Kaldır' : 'İndirim'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {unsoldProducts.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-3 text-muted small">Tüm ürünleriniz aktif satılıyor! 🚀</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
