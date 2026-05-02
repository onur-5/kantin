import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const NotificationsPage = () => {
  const { notifications, fetchNotifications, readAllNotifications, language } = useData();
  const [activeTab, setActiveTab] = useState('Hepsi');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const categories = ['Hepsi', 'Ürün', 'Öğrenci', 'Sistem'];

  const filteredNotifications = activeTab === 'Hepsi' 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  const getIcon = (category) => {
    switch (category) {
      case 'Ürün': return 'bi-box-seam';
      case 'Öğrenci': return 'bi-person-badge';
      case 'Sistem': return 'bi-cpu';
      default: return 'bi-bell';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'danger': return 'border-danger bg-danger-subtle';
      case 'warning': return 'border-warning bg-warning-subtle';
      case 'info': return 'border-info bg-info-subtle';
      default: return 'border-secondary';
    }
  };

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-primary">Bildirim Merkezi</h3>
          <p className="text-muted small mb-0">Tüm kritik olaylar ve sistem uyarıları burada listelenir.</p>
        </div>
        <button className="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm" onClick={readAllNotifications}>
          <i className="bi bi-check2-all me-2"></i>Tümünü Okundu İşaretle
        </button>
      </div>

      {/* Kategori Sekmeleri */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-2">
          <div className="nav nav-pills nav-justified gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`nav-link rounded-pill fw-bold transition-all ${activeTab === cat ? 'active shadow' : 'text-secondary'}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
                {cat !== 'Hepsi' && (
                  <span className="badge border text-secondary ms-2 small">
                    {notifications.filter(n => n.category === cat && !n.isRead).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bildirim Listesi */}
      <div className="row g-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(n => (
            <div className="col-12" key={n.id}>
              <div className={`p-3 rounded-4 border-start border-4 ${n.isRead ? 'bg-body-secondary bg-opacity-50' : 'bg-body shadow-sm'} ${n.type === 'danger' ? 'border-danger' : n.type === 'warning' ? 'border-warning' : 'border-primary'}`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-center">
                    {n.category === 'Sistem' ? (
                       <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
                         <i className="bi bi-shield-lock-fill fs-4"></i>
                       </div>
                    ) : (
                      <div className={`p-2 rounded-3 me-3 ${n.type === 'danger' ? 'bg-danger text-white' : 'bg-primary bg-opacity-10 text-primary'}`}>
                        <i className={`bi ${n.category === 'Ürün' ? 'bi-box-seam' : 'bi-person-fill'} fs-4`}></i>
                      </div>
                    )}
                    <div>
                      <div className="fw-bold d-flex align-items-center">
                        {n.message}
                        {!n.isRead && <span className="ms-2 badge bg-primary dot-badge p-1"> </span>}
                      </div>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(n.createdAt).toLocaleString('tr-TR')}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="display-1 text-muted opacity-25 mb-3"><i className="bi bi-bell-slash"></i></div>
            <p className="text-muted">Bu kategoride bildirim bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
