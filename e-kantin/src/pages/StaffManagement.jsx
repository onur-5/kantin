import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../utils/translations';

export const StaffManagement = () => {
  const { staff, students, cards, addStaff, updateBalance, deleteStaff, language } = useData();
  const t = translations[language] || translations['TR'];
  const showToast = useToast();
  
  const [newPerson, setNewPerson] = useState({ id: '', name: '', surname: '', email: '', phone: '', password: '123', initialBalance: 0 });

  const handleAdd = (e) => {
    e.preventDefault();
    const cleanId = newPerson.id.trim();
    const idExists = (students || []).some(s => String(s.id) === cleanId) || 
                     (staff || []).some(s => String(s.id) === cleanId);

    if (idExists) {
      return showToast("Bu numara/ID zaten sistemde kayıtlı (Öğrenci veya Personel olarak)!", "danger");
    }
    
    // Aynı mail adresinin olup olmadığını kontrol et
    if (newPerson.email && (staff || []).some(s => s.email && s.email.toLowerCase() === newPerson.email.trim().toLowerCase())) {
      return showToast("Bu e-posta adresi sistemde zaten kayıtlı!", "danger");
    }

    addStaff({ 
      id: newPerson.id.trim(), 
      name: newPerson.name, 
      surname: newPerson.surname, 
      email: newPerson.email,
      phone: newPerson.phone,
      password: newPerson.password,
      role: 'staff' 
    }, newPerson.initialBalance);
    
    setNewPerson({ id: '', name: '', surname: '', email: '', phone: '', password: '123', initialBalance: 0 });
    showToast("Personel/Kullanıcı eklendi.", "success");
  };

  const handleDelete = (id, name) => {
    // 🛡️ KRİTİK SİLME FONKSİYONU
    if (window.confirm(`${name} isimli kullanıcıyı ve bağlı tüm kart verilerini silmek istediğinizden emin misiniz?`)) {
      deleteStaff(id); // DataContext içindeki silme fonksiyonu
      showToast("Kullanıcı sistemden başarıyla silindi.", "warning");
    }
  };

  const topluMailGonder = async () => {
    // Sadece borcu olan ve maili olan personeli/hocaları filtrele ve bakiyelerini objeye ekle
    const borclular = (staff || [])
      .map(s => {
        const card = (cards || []).find(c => String(c.studentId) === String(s.id));
        return { ...s, balance: card?.balance || 0 };
      })
      .filter(s => s.balance < 0 && s.email && s.role !== 'student');
    
    if (borclular.length === 0) {
        alert("Borçlu personel bulunamadı.");
        return;
    }

    alert(`Arka planda ${borclular.length} kişiye mail gönderimi başlıyor... Lütfen bekleyin.`);

    try {
        const response = await fetch('http://localhost:5000/api/send-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borclular })
        });

        if (response.ok) {
            alert("✅ BAŞARILI: Mailler arka plandan gönderildi, Outlook açılmadı!");
        } else {
            alert("❌ HATA: Sunucu (Node.js) yanıt vermedi.");
        }
    } catch (error) {
        console.log("Hata detayı:", error);
        alert("❌ BAĞLANTI HATASI: Sunucunun (node server.js) çalıştığından emin olun.");
    }
  };

  const whatsappGonder = async () => {
    const borclular = (staff || [])
      .map(s => {
        const card = (cards || []).find(c => String(c.studentId) === String(s.id));
        return { ...s, balance: card?.balance || 0 };
      })
      .filter(s => s.balance < 0 && s.phone && s.role !== 'student');
    
    if (borclular.length === 0) {
        alert("Borçlu ve telefon numarası kayıtlı personel bulunamadı.");
        return;
    }

    alert(`Arka planda ${borclular.length} kişiye WhatsApp mesajı gönderimi başlıyor...`);

    try {
        const response = await fetch('http://localhost:5000/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borclular })
        });

        if (response.ok) {
            alert("✅ BAŞARILI: WhatsApp mesajları arka plandan gönderildi!");
        } else {
            alert("❌ HATA: Sunucu yanıt vermedi.");
        }
    } catch (error) {
        console.log("Hata detayı:", error);
        alert("❌ BAĞLANTI HATASI: Sunucunun çalıştığından emin olun.");
    }
  };

  return (
    <div className="container-fluid animate-fade-in py-4">
      <div className="row g-4">
        {/* KAYIT FORMU */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4 text-primary">
              <i className="bi bi-person-plus-fill me-2"></i>Personel/Öğrenci Kaydı
            </h5>
            <form onSubmit={handleAdd}>
              <div className="mb-3">
                <label className="form-label small fw-bold">No / ID</label>
                <input type="text" className="form-control bg-light border-0" value={newPerson.id} onChange={e => setNewPerson({...newPerson, id: e.target.value})} required />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Ad</label>
                  <input type="text" className="form-control bg-light border-0" value={newPerson.name} onChange={e => setNewPerson({...newPerson, name: e.target.value})} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Soyad</label>
                  <input type="text" className="form-control bg-light border-0" value={newPerson.surname} onChange={e => setNewPerson({...newPerson, surname: e.target.value})} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">E-posta</label>
                <input type="email" className="form-control bg-light border-0" placeholder="örnek@okul.com" value={newPerson.email} onChange={e => setNewPerson({...newPerson, email: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Telefon Numarası</label>
                <input type="tel" className="form-control bg-light border-0" placeholder="5551234567" value={newPerson.phone} onChange={e => setNewPerson({...newPerson, phone: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Şifre Belirle</label>
                <input type="password" className="form-control bg-light border-0" value={newPerson.password} onChange={e => setNewPerson({...newPerson, password: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-success">Başlangıç Bakiyesi (₺)</label>
                <input type="number" className="form-control border-success-subtle" value={newPerson.initialBalance} onChange={e => setNewPerson({...newPerson, initialBalance: e.target.value})} />
              </div>
              <button className="btn btn-primary w-100 fw-bold rounded-pill py-2 shadow-sm">KAYDET</button>
            </form>
          </div>
        </div>

        {/* LİSTE TABLOSU */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Kullanıcı Listesi ve Yönetim</h5>
              <div className="d-flex gap-2">
                  <button 
                      type="button"
                      onClick={topluMailGonder} 
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                  >
                      📧 Otomatik Mail
                  </button>
                  <button 
                      type="button"
                      onClick={whatsappGonder} 
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                  >
                      💬 WhatsApp Hatırlatması
                  </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>İsim Soyisim</th>
                    <th>ID</th>
                    <th>E-posta</th>
                    <th>Telefon</th>
                    <th>Bakiye</th>
                    <th className="text-end px-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {(staff || []).map(s => {
                    const card = (cards || []).find(c => String(c.studentId) === String(s.id));
                    return (
                      <tr key={s.id}>
                        <td className="fw-bold">{s.name} {s.surname}</td>
                        <td><code>{s.id}</code></td>
                        <td className="text-muted small">{s.email || '-'}</td>
                        <td className="text-muted small">{s.phone || '-'}</td>
                        <td>
                          <span className={`fw-bold ${(card?.balance || 0) < 0 ? 'text-danger' : 'text-success'}`}>
                            {card?.balance?.toFixed(2) || '0.00'} ₺
                          </span>
                        </td>
                        <td className="text-end px-4">
                          <div className="btn-group btn-group-sm rounded-pill overflow-hidden shadow-sm me-3">
                            <button className="btn btn-outline-success fw-bold" onClick={() => card ? updateBalance(card.cardId, 50) : alert("Önce karta sahip olduğundan emin olun.")}>+50</button>
                            <button className="btn btn-outline-danger fw-bold" onClick={() => card ? updateBalance(card.cardId, -10) : alert("Önce karta sahip olduğundan emin olun.")}>-10</button>
                          </div>
                          {/* SİLME BUTONU - KIRMIZI VE İŞLEVSEL */}
                          <button 
                            className="btn btn-sm btn-danger fw-bold rounded-pill shadow-sm" 
                            title="Kullanıcıyı Sil"
                            onClick={() => handleDelete(s.id, s.name)}
                          >
                            <i className="bi bi-person-x-fill me-1"></i>Kişiyi Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!staff || staff.length === 0) && (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">Henüz kayıtlı kullanıcı bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
