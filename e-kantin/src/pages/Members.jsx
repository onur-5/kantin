import { useState } from 'react';
import { useData } from '../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
import { Pencil, Trash2, Plus, Search, Mail } from 'lucide-react';
import { getApiUrl, handleApiError } from '../utils/api';

export const Members = () => {
  const { members, setMembers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', studentNo: '', type: 'Personel', email: '' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Aynı e-posta adresinin sistemde olup olmadığını kontrol et
    if (formData.email) {
      const emailExists = members.some(m => 
        m.email && 
        m.email.toLowerCase() === formData.email.trim().toLowerCase() && 
        m.id !== editingId // Düzenleme yapılıyorsa kendi ID'sini hariç tut
      );
      
      if (emailExists) {
        alert("Bu e-posta adresi sistemde zaten kayıtlı!");
        return;
      }
    }

    if (editingId) {
      setMembers(members.map(m => m.id === editingId ? { ...m, ...formData } : m));
      setEditingId(null);
    } else {
      setMembers([...members, { id: uuidv4(), ...formData, createdAt: new Date().toISOString() }]);
    }
    setFormData({ name: '', studentNo: '', type: 'Personel', email: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleEdit = (member) => {
    setFormData({ name: member.name, studentNo: member.studentNo, type: member.type, email: member.email || '' });
    setEditingId(member.id);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.studentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🚀 KESİN ÇÖZÜM: TOPLU MAİL GÖNDERİMİ (OUTLOOK'U SİLER)
  const topluMailGonder = async () => {
    const borclular = members.filter(m => (m.balance < 0) && (m.email) && m.type !== 'Öğrenci');

    if (borclular.length === 0) {
      alert("Borçlu personel bulunamadı.");
      return;
    }

    alert(`${borclular.length} kişiye mail gönderimi arka planda başlıyor...`);

    const apiUrl = getApiUrl('/api/send-reminders');
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borclular })
      });

      if (response.ok) {
        alert("✅ Tebrikler! Mailler Outlook açılmadan, arka plandan başarıyla gönderildi.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const serverError = errorData.error || `Sunucu hatası (Durum: ${response.status})`;
        alert(`❌ Sunucu hatası: ${serverError}\nLütfen backend'in çalıştığından emin olun.`);
      }
    } catch (error) {
      const userMsg = handleApiError(error, apiUrl);
      alert(`❌ Bağlantı hatası!\n${userMsg}`);
    }
  };

  // 🚀 BİREYSEL MAİL GÖNDERİMİ (BACKEND ÜZERİNDEN)
  const bireyselMailGonder = async (member) => {
    if (!member.email) return;

    const apiUrl = getApiUrl('/api/send-reminders');
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borclular: [member] }) // Tek kişilik liste gönderiyoruz
      });

      if (response.ok) {
        alert(`✅ ${member.name} kişisine mail sessizce gönderildi.`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Mail gönderilemedi: ${errorData.error || `Sunucu hatası (${response.status})`}`);
      }
    } catch (error) {
      const userMsg = handleApiError(error, apiUrl);
      alert(`❌ Sunucuya bağlanılamadı!\n${userMsg}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Personel Listeleme</h1>
        <div className="text-sm text-gray-500">E-Kantin &gt; Personel Listeleme</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{editingId ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim Soyisim</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none"
              placeholder="Örn: Ahmet Beyazıt"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Personel No</label>
            <input
              type="text"
              required
              value={formData.studentNo}
              onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none"
              placeholder="Örn: 103"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none"
              placeholder="Örn: ornek@mail.com"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none"
            >
              <option value="Personel">Personel</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {editingId ? <Pencil size={18} /> : <Plus size={18} />}
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setFormData({ name: '', studentNo: '', type: 'Personel', email: '' }) }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        {/* TOPLU MAİL BUTONU (BACKEND BAĞLANTILI) */}
        <button
          onClick={topluMailGonder}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 mb-4"
        >
          📧 Arka Plandan Otomatik Mail Gönder
        </button>

        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Sayfada</span>
            <select className="border border-gray-300 rounded px-2 py-1 outline-none">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span>kayıt göster</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Ara:"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-dark focus:border-brand-dark outline-none w-64"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        <table className="w-full text-left border-collapse mt-4">
          <thead>
            <tr className="bg-white text-gray-500 border-b border-gray-200">
              <th className="px-6 py-4 font-medium">İsim</th>
              <th className="px-6 py-4 font-medium">Personel No</th>
              <th className="px-6 py-4 font-medium">Tip</th>
              <th className="px-6 py-4 font-medium">E-posta</th>
              <th className="px-6 py-4 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member, index) => (
                <tr key={member.id} className={`${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0`}>
                  <td className="px-6 py-4 font-medium text-gray-800">{member.name}</td>
                  <td className="px-6 py-4 text-gray-600">{member.studentNo}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {member.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{member.email || '-'}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    {/* BİREYSEL HATIRLATMA BUTONU (ARTI SEÇİLEN KİŞİYE SESSİZCE MAİL ATAR) */}
                    {member.balance < 0 && (
                      <button
                        onClick={() => bireyselMailGonder(member)}
                        disabled={!member.email}
                        className={`p-2 rounded transition-colors text-white ${!member.email ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-[#1e40af]'}`}
                        title={!member.email ? 'Mail adresi eksik' : 'Arka Plandan Hatırlat'}
                      >
                        <Mail size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(member)}
                      className="bg-[#10b981] hover:bg-emerald-600 text-white p-2 rounded transition-colors"
                      title="Düzenle"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="bg-[#ef4444] hover:bg-red-600 text-white p-2 rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
