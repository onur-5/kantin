import { useEffect } from 'react';
import { useData } from '../context/DataContext';

const StockTracking = () => {
  const { products, transactions, getStockPredictions, predictions, language } = useData();

  useEffect(() => {
    getStockPredictions();
  }, [products, transactions]);

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="mb-4">
        <h3 className="fw-bold text-primary">Akıllı Stok Takip & Analiz</h3>
        <p className="text-muted">Ürünlerin tükenme hızları ve kritik stok seviyeleri yapay zeka ile analiz edilir.</p>
      </div>

      {/* KRİTİK STOK ALARMI */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-danger text-white p-3 border-0 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Kritik Stok Seviyesindeki Ürünler</h6>
          <span className="badge border border-white text-white">Acil</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="small">
                <tr>
                  <th className="ps-4">Ürün</th>
                  <th>Mevcut Stok</th>
                  <th>Eşik Değeri</th>
                  <th className="pe-4 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.filter(p => p.stock <= (p.threshold || 5)).map(p => (
                  <tr key={p.barcode}>
                    <td className="ps-4 fw-bold">{p.name}</td>
                    <td><span className="badge bg-danger rounded-pill">{p.stock}</span></td>
                    <td>{p.threshold || 5}</td>
                    <td className="pe-4 text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-pill">Sipariş Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BURN RATE ANALİZİ */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-dark text-white p-3 border-0 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold"><i className="bi bi-speedometer2 me-2"></i>Stok Tükenme Tahmini (Burn Rate)</h6>
          <span className="badge bg-primary">AI Tahminleme</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="small">
                <tr>
                  <th className="ps-4">Ürün</th>
                  <th>Günlük Satış Hızı</th>
                  <th>Kalan Stok</th>
                  <th>Tahmini Kalan Süre</th>
                  <th className="pe-4 text-end">Durum</th>
                </tr>
              </thead>
              <tbody>
                {predictions?.filter(p => Number(p.dailyVelocity) > 0).map(p => (
                  <tr key={p.barcode}>
                    <td className="ps-4 fw-bold">{p.name}</td>
                    <td>{p.dailyVelocity} adet/gün</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`fw-bold ${p.status === 'critical' ? 'text-danger' : p.status === 'warning' ? 'text-warning' : 'text-success'}`}>
                        {p.remainingDays} gün
                      </span>
                    </td>
                    <td className="pe-4 text-end">
                      {p.status === 'critical' && <span className="badge rounded-pill bg-danger animate-pulse">KRİTİK</span>}
                      {p.status === 'warning' && <span className="badge rounded-pill bg-warning text-dark">YAKINDA</span>}
                      {p.status === 'safe' && <span className="badge rounded-pill bg-success">GÜVENLİ</span>}
                    </td>
                  </tr>
                ))}
                {(!predictions || predictions.filter(p => Number(p.dailyVelocity) > 0).length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted small">Tahminleme için daha fazla satış verisi gerekiyor...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTracking;
