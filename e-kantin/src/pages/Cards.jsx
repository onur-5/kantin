import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export const Cards = () => {
  const { students, cards, setCards } = useData();
  const showToast = useToast();
  const [newCard, setNewCard] = useState({ cardId: '', studentId: '', balance: 0 });
  const [editingCardId, setEditingCardId] = useState(null);
  const [editBalance, setEditBalance] = useState(0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCard.cardId || !newCard.studentId) return;

    if (cards.find(c => c.cardId === newCard.cardId)) {
      showToast("Bu kart ID zaten sistemde kayıtlı!", 'danger');
      return;
    }
    if (cards.find(c => c.studentId === newCard.studentId)) {
      showToast("Bu öğrencinin zaten bir kartı var!", 'warning');
      return;
    }

    setCards([...cards, { ...newCard, lastActivity: new Date().toISOString() }]);
    setNewCard({ cardId: '', studentId: '', balance: 0 });
    showToast("Kart başarıyla tanımlandı.", 'success');
  };

  const startEdit = (card) => {
    setEditingCardId(card.cardId);
    setEditBalance(card.balance);
  };

  const saveBalance = (cardId) => {
    if (editBalance < 0) {
      showToast("Bakiye eksi olamaz!", 'danger');
      return;
    }
    setCards(cards.map(c => 
      c.cardId === cardId ? { ...c, balance: parseFloat(editBalance), lastActivity: new Date().toISOString() } : c
    ));
    setEditingCardId(null);
    showToast("Bakiye güncellendi.", 'success');
  };

  const addQuickBalance = (amount) => {
    setEditBalance(prev => parseFloat(prev) + amount);
  };

  return (
    <div className="container-fluid animate-fade-in">
      <h2 className="fw-bold mb-4 text-primary">Kart ve Bakiye Yönetimi</h2>

      <div className="card shadow-sm border-0 mb-4 rounded-4">
        <div className="card-body p-4 bg-dark text-white rounded-4">
          <h5 className="mb-3 text-info"><i className="bi bi-credit-card-2-front me-2"></i>Öğrenciye Kart Tanımla</h5>
          <form onSubmit={handleAdd} className="row g-3">
            <div className="col-md-4">
              <input 
                type="text" 
                className="form-control bg-secondary text-white border-0" 
                placeholder="Kart No (Barkod/ID)" 
                value={newCard.cardId}
                onChange={(e) => setNewCard({...newCard, cardId: e.target.value})}
                required
              />
            </div>
            <div className="col-md-4">
              <select 
                className="form-select bg-secondary text-white border-0" 
                value={newCard.studentId}
                onChange={(e) => setNewCard({...newCard, studentId: e.target.value})}
                required
              >
                <option value="">Öğrenci Seçin</option>
                {students.map(s => {
                  const hasCard = cards.some(c => c.studentId === s.id);
                  return (
                    <option key={s.id} value={s.id} disabled={hasCard}>
                      {s.name} {s.surname} ({s.studentNo}) {hasCard ? '- Kartı Var' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="col-md-2">
              <input 
                type="number" 
                className="form-control bg-secondary text-white border-0" 
                placeholder="Başlangıç Bakiye" 
                value={newCard.balance}
                onChange={(e) => setNewCard({...newCard, balance: parseFloat(e.target.value)})}
                required
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-info w-100 fw-bold">
                TANIMLA
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Kart No</th>
                  <th>Öğrenci</th>
                  <th>Mevcut Bakiye</th>
                  <th>Son İşlem</th>
                  <th className="text-end px-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => {
                  const student = students.find(s => s.id === card.studentId);
                  return (
                    <tr key={card.cardId}>
                      <td className="px-4"><span className="badge bg-secondary">#{card.cardId}</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary-subtle rounded-circle p-2 me-2 d-none d-sm-block">
                            <i className="bi bi-person text-primary"></i>
                          </div>
                          <span className="fw-medium">{student ? `${student.name} ${student.surname}` : 'Silinmiş Öğrenci'}</span>
                        </div>
                      </td>
                      <td>
                        {editingCardId === card.cardId ? (
                          <div className="d-flex flex-column gap-2" style={{ maxWidth: '200px' }}>
                            <div className="input-group input-group-sm">
                              <input 
                                type="number" 
                                className="form-control" 
                                value={editBalance}
                                onChange={(e) => setEditBalance(e.target.value)}
                              />
                              <button className="btn btn-success" onClick={() => saveBalance(card.cardId)}><i className="bi bi-check"></i></button>
                            </div>
                            <div className="btn-group btn-group-sm w-100">
                              <button className="btn btn-outline-secondary" onClick={() => addQuickBalance(20)}>+20₺</button>
                              <button className="btn btn-outline-secondary" onClick={() => addQuickBalance(50)}>+50₺</button>
                              <button className="btn btn-outline-secondary" onClick={() => addQuickBalance(100)}>+100₺</button>
                              <button className="btn btn-outline-secondary" onClick={() => addQuickBalance(200)}>+200₺</button>
                            </div>
                          </div>
                        ) : (
                          <span className="fw-bold fs-5 text-primary">{card.balance} ₺</span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(card.lastActivity).toLocaleString()}</td>
                      <td className="text-end px-4">
                        {editingCardId !== card.cardId && (
                          <button 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => startEdit(card)}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Bakiye Düzenle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {cards.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">Sistemde tanımlı kart bulunmamaktadır.</td>
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
