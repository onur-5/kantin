import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../utils/translations';
import { QRCodeSVG } from 'qrcode.react';

export const Students = () => {
  const { students, staff, addStudent, deleteStudent, language } = useData();
  const t = translations[language] || translations['TR'];
  const showToast = useToast();
  
  const [newStudent, setNewStudent] = useState({ 
    id: '', name: '', surname: '', class: '', password: ''
  });
  const [showQR, setShowQR] = useState(null);

  const handleDelete = async (id, name) => {
    if (window.confirm(`${name} isimli öğrenciyi ve bağlı tüm verilerini silmek istediğinizden emin misiniz?`)) {
      await deleteStudent(id);
      showToast("Öğrenci sistemden silindi.", "warning");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const idExists = (students || []).some(s => String(s.id) === newStudent.id.trim()) || 
                     (staff || []).some(s => String(s.id) === newStudent.id.trim());

    if (idExists) {
      return showToast("Bu numara/ID zaten sistemde kayıtlı (Öğrenci veya Personel olarak)!", "danger");
    }
    
    const result = await addStudent({ ...newStudent });
    
    if (result.success) {
      setNewStudent({ id: '', name: '', surname: '', class: '', password: '' });
      showToast("Öğrenci ve Kartı başarıyla oluşturuldu.", "success");
    } else {
      showToast(`Hata: ${result.message}`, "danger");
    }
  };

  return (
    <div className="container-fluid animate-fade-in py-4">
      <div className="row g-4">
        {/* KAYIT FORMU */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4 text-primary"><i className="bi bi-person-plus me-2"></i>Öğrenci Kaydı</h5>
            <form onSubmit={handleAdd}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Öğrenci No (ID)</label>
                <input type="text" className="form-control" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Şifre</label>
                <input type="password" className="form-control" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} required />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Ad</label>
                  <input type="text" className="form-control" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Soyad</label>
                  <input type="text" className="form-control" value={newStudent.surname} onChange={e => setNewStudent({...newStudent, surname: e.target.value})} required />
                </div>
              </div>
              <button className="btn btn-primary w-100 fw-bold rounded-pill mt-3">Kaydı Tamamla</button>
            </form>
          </div>
        </div>

        {/* LİSTE */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4">Öğrenci Listesi</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>ID</th>
                    <th className="text-end">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-bold">{s.name} {s.surname}</div>
                        <small className="text-muted">{s.class}</small>
                      </td>
                      <td><code>{s.id}</code></td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button className="btn btn-sm btn-outline-secondary rounded-pill fw-bold" onClick={() => setShowQR(s.id)}>
                            <i className="bi bi-qr-code me-1"></i> QR Kart
                          </button>
                          <button 
                            className="btn btn-sm btn-danger fw-bold rounded-pill shadow-sm" 
                            onClick={() => handleDelete(s.id, s.name)}
                          >
                            <i className="bi bi-person-x-fill me-1"></i>Kişiyi Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      {showQR && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 text-center p-4">
              <h5 className="fw-bold mb-4">Öğrenci QR Kartı</h5>
              <div className="p-4 bg-white rounded-4 d-inline-block mx-auto mb-4 border">
                {/* User's request: QR should be a URL with ID at the end */}
                <QRCodeSVG value={`http://kantin.com/ogrenci/${showQR}`} size={200} />
              </div>
              <p className="fw-bold mb-1">{students.find(s => s.id === showQR)?.name}</p>
              <code className="d-block mb-4">{showQR}</code>
              <button className="btn btn-primary w-100 rounded-pill fw-bold" onClick={() => setShowQR(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
