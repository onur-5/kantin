import { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../utils/translations';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const initialProducts = [
    { barcode: '101', name: 'Sade Simit', price: 10, basePrice: 10, purchasePrice: 7, stock: 50, threshold: 10, saleCount: 0 },
    { barcode: '102', name: 'Peynirli Poğaça', price: 12, basePrice: 12, purchasePrice: 8, stock: 40, threshold: 10, saleCount: 0 },
    { barcode: '202', name: 'Su (0.5L)', price: 5, basePrice: 5, purchasePrice: 2, stock: 200, threshold: 30, saleCount: 0 }
  ];

  const [products, _setProducts] = useState([]);
  const [students, _setStudents] = useState([]);
  const [staff, _setStaff] = useState([]);
  const [cards, _setCards] = useState([]);
  const [transactions, _setTransactions] = useState([]);
  const [announcements, _setAnnouncements] = useState([]);
  const [wishes, _setWishes] = useState([]);
  const [wastage, setWastage] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [language, setLanguage] = useState('TR');
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // SUPABASE'TEN İLK YÜKLEME
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setLoading(true);
      try {
        const [
          { data: pData }, { data: stData }, { data: sfData },
          { data: cData }, { data: tData }, { data: nData },
          { data: aData }, { data: wData }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('students').select('*'),
          supabase.from('staff').select('*'),
          supabase.from('cards').select('*'),
          supabase.from('transactions').select('*').order('date', { ascending: false }).limit(1000),
          supabase.from('notifications').select('*').order('createdAt', { ascending: false }),
          supabase.from('announcements').select('*').order('date', { ascending: false }),
          supabase.from('wishes').select('*').order('date', { ascending: false })
        ]);

        if (pData && pData.length > 0) _setProducts(pData);
        if (stData && stData.length > 0) _setStudents(stData);
        if (sfData && sfData.length > 0) _setStaff(sfData);
        if (cData && cData.length > 0) _setCards(cData);
        if (tData && tData.length > 0) _setTransactions(tData);
        if (nData && nData.length > 0) setNotifications(nData);
        if (aData && aData.length > 0) _setAnnouncements(aData);
        if (wData && wData.length > 0) _setWishes(wData);
      } catch (error) {
        console.error("Supabase veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSupabaseData();
  }, []);

  // SETTERS WITH SUPABASE UPSERT (Dinamik Senkronizasyon)
  const setProducts = async (data) => {
    const newData = typeof data === 'function' ? data(products) : data;
    _setProducts(newData);
    if(Array.isArray(newData) && newData.length > 0) {
      const sanitized = newData.map(d => {
        const copy = {...d};
        delete copy.lastSaleDate;
        
        // basePrice zorunlu, eksikse price değerini ata
        if (copy.basePrice === undefined) copy.basePrice = copy.price;
        
        // Boş tarihleri null yap ki veritabanı hata vermesin
        if (copy.expirationDate === '') copy.expirationDate = null;
        
        return copy;
      });
      const { error } = await supabase.from('products').upsert(sanitized);
      if (error) console.error("Ürün kaydetme hatası:", error.message, error.details);
    }
  };
  
  const setStudents = async (data) => {
    const newData = typeof data === 'function' ? data(students) : data;
    _setStudents(newData);
    if(Array.isArray(newData) && newData.length > 0) {
      const { error } = await supabase.from('students').upsert(newData);
      if (error) console.error("Öğrenci kaydetme hatası:", error.message, error.details);
    }
  };
  
  const setStaff = async (data) => {
    const newData = typeof data === 'function' ? data(staff) : data;
    _setStaff(newData);
    if(Array.isArray(newData) && newData.length > 0) {
      const { error } = await supabase.from('staff').upsert(newData);
      if (error) console.error("Personel kaydetme hatası:", error.message, error.details);
    }
  };
  
  const setCards = async (data) => {
    const newData = typeof data === 'function' ? data(cards) : data;
    _setCards(newData);
    if(Array.isArray(newData) && newData.length > 0) {
      const sanitized = newData.map(c => {
        const copy = { ...c };
        delete copy.lastActivity; // SQL'de olmayan bir alan
        return copy;
      });
      const { error } = await supabase.from('cards').upsert(sanitized);
      if (error) console.error("Kart kaydetme hatası:", error.message, error.details);
    }
  };

  const setTransactions = async (data) => {
    const newData = typeof data === 'function' ? data(transactions) : data;
    _setTransactions(newData);
    if(Array.isArray(newData) && newData.length > 0) {
      const { error } = await supabase.from('transactions').upsert(newData.slice(0, 10));
      if (error) console.error("İşlem kaydetme hatası:", error.message, error.details);
    }
  };

  const setAnnouncements = async (data) => {
    const newData = typeof data === 'function' ? data(announcements) : data;
    const oldData = [...announcements];
    _setAnnouncements(newData);
    
    try {
      if (newData.length < oldData.length) {
        const deleted = oldData.find(o => !newData.some(n => n.id === o.id));
        if (deleted) {
          const { error } = await supabase.from('announcements').delete().eq('id', deleted.id);
          if (error) return { success: false, error: error.message };
        }
      } else {
        const newest = newData.find(n => !oldData.some(o => o.id === n.id));
        if (newest) {
          const { error } = await supabase.from('announcements').upsert([newest]);
          if (error) return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err) { 
      console.error("Duyuru senkronizasyon hatası:", err);
      return { success: false, error: err.message };
    }
  };

  const setWishes = async (data) => {
    const newData = typeof data === 'function' ? data(wishes) : data;
    const oldData = [...wishes];
    _setWishes(newData);

    try {
      if (newData.length < oldData.length) {
        const deleted = oldData.find(o => !newData.some(n => n.id === o.id));
        if (deleted) {
          const { error } = await supabase.from('wishes').delete().eq('id', deleted.id);
          if (error) return { success: false, error: error.message };
        }
      } else {
        const newest = newData.find(n => !oldData.some(o => o.id === n.id));
        if (newest) {
          const { error } = await supabase.from('wishes').upsert([newest]);
          if (error) return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err) { 
      console.error("Talep senkronizasyon hatası:", err);
      return { success: false, error: err.message };
    }
  };

  // Dinamik Fiyatları Backend yerine local hesapla
  const syncDynamicPrices = async (currentProducts) => {
    try {
      const updated = currentProducts.map(p => {
        let newPrice = p.basePrice || p.price;
        if (p.stock <= (p.threshold || 5)) {
          newPrice = (p.basePrice || p.price) * 1.1;
        } else if (p.stock > 100) {
          newPrice = (p.basePrice || p.price) * 0.95;
        }
        return { ...p, price: Number(newPrice.toFixed(2)) };
      });
      setProducts(updated);
    } catch (error) {
      console.error("Fiyat senkronizasyon hatası:", error);
    }
  };

  const getStockPredictions = async () => {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const recentSales = transactions.filter(t => new Date(t.date) >= last7Days);
      
      const stats = products.map(p => {
        let totalQty = 0;
        recentSales.forEach(t => {
          (t.items || []).forEach(item => {
            if (item.barcode === p.barcode || item.name === p.name) {
              totalQty += (item.quantity || 1);
            }
          });
        });

        const dailyVelocity = (totalQty / 7).toFixed(2);
        const remainingDays = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : 999;
        let status = 'safe';
        if (remainingDays <= 2) status = 'critical';
        else if (remainingDays <= 5) status = 'warning';

        return {
          barcode: p.barcode,
          name: p.name,
          stock: p.stock,
          dailyVelocity,
          remainingDays: remainingDays === 999 ? '∞' : remainingDays,
          status
        };
      });
      setPredictions(stats);
    } catch (error) {
      console.error("Tahminleme hatası:", error);
    }
  };

  const checkStockLevels = async (currentProducts) => {
    if (!currentProducts || currentProducts.length === 0) return;
    
    try {
      // Mevcut okunmamış ürün bildirimlerini çekelim
      const { data: currentNotifs } = await supabase.from('notifications')
        .select('message')
        .eq('category', 'Ürün')
        .eq('isRead', false);
      
      const activeMessages = (currentNotifs || []).map(n => n.message);

      for (const p of currentProducts) {
        const threshold = p.threshold || 5;
        if (p.stock <= threshold) {
          const isOut = p.stock <= 0;
          
          // Spam önleme: Eğer ürün TÜKENDİ ise ve zaten TÜKENDİ bildirimi varsa gönderme.
          // Eğer ürün AZALIYOR ise ve zaten herhangi bir AZALIYOR bildirimi varsa gönderme (rakam değişse bile).
          const alreadyHasOutNotif = activeMessages.some(m => m.includes(p.name) && m.includes('TÜKENDİ'));
          const alreadyHasLowNotif = activeMessages.some(m => m.includes(p.name) && m.includes('azalıyor'));

          if (isOut && !alreadyHasOutNotif) {
            const msg = `${p.name} ürünü TÜKENDİ! Hemen stok yenileyin.`;
            await supabase.from('notifications').insert([{
              id: uuidv4(),
              category: 'Ürün',
              message: msg,
              type: 'danger'
            }]);
            fetchNotifications();
          } else if (!isOut && !alreadyHasLowNotif && !alreadyHasOutNotif) {
            // Sadece tükendi değilse ve daha önce ne tükendi ne de azalıyor uyarısı verilmediyse gönder
            const msg = `${p.name} ürünü azalıyor! (Kalan: ${p.stock})`;
            await supabase.from('notifications').insert([{
              id: uuidv4(),
              category: 'Ürün',
              message: msg,
              type: 'warning'
            }]);
            fetchNotifications();
          }
        }
      }
    } catch (error) {
      console.error("Stok kontrol hatası:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase.from('notifications').select('*').order('createdAt', { ascending: false });
      if (data) setNotifications(data);
    } catch (error) {
      console.error("Bildirim çekme hatası:", error);
    }
  };

  const readAllNotifications = async () => {
    try {
      await supabase.from('notifications').update({ isRead: true }).neq('isRead', true);
      fetchNotifications();
    } catch (error) {
      console.error("Bildirim okuma hatası:", error);
    }
  };

  const checkSuspiciousSpending = async (studentName, amount) => {
    try {
      if (amount > 500) {
        await supabase.from('notifications').insert([{
          id: uuidv4(),
          category: 'Öğrenci',
          message: `${studentName} tek seferde ${amount} TL harcama yaptı!`,
          type: 'warning'
        }]);
        fetchNotifications();
      }
    } catch (error) {}
  };

  const applyAutoSKTDiscount = () => {
    const today = new Date();
    let updated = false;
    const newProducts = products.map(p => {
      if (p.expirationDate) {
        const expDate = new Date(p.expirationDate);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 2 && diffDays > 0 && !p.isSKTDiscounted) {
          updated = true;
          return { ...p, discountedPrice: p.price * 0.5, isSKTDiscounted: true, priceTrend: 'down' };
        }
      }
      return p;
    });
    if (updated) setProducts(newProducts);
  };

  useEffect(() => {
    if(products.length > 0) {
      applyAutoSKTDiscount();
    }
  }, [products]);

  const recordLogin = async (username, role) => {
    // Loglama işlemini doğrudan Supabase notifications'a yazalım
    try {
      await supabase.from('notifications').insert([{
        id: uuidv4(),
        category: 'Sistem',
        message: `${username} (${role}) sisteme giriş yaptı.`,
        type: 'info'
      }]);
      fetchNotifications();
    } catch (error) {}
  };

  // LocalStorage senkronizasyonu kullanıcı isteği üzerine kaldırıldı.
  // Artık sadece Supabase veritabanı kullanılmaktadır.

  // POS LOGIC (Supabase Uyumlu)
  const processSaleV14 = async (cardNo, amount, cartItems) => {
    let card = cards.find(c => String(c.cardId) === String(cardNo));
    let student = students.find(s => String(s.id) === String(cardNo));
    let person = staff.find(s => String(s.id) === String(cardNo));

    // Kart yoksa ama girilen kod bir personel veya öğrenci ID'si ise anında kart oluştur
    if (!card) {
      if (student || person) {
        card = { cardId: cardNo, studentId: cardNo, balance: 0, status: 'active' };
        await supabase.from('cards').insert([card]);
        // State güncellenmesi işlemin sonunda yapılacak
      } else {
        return { success: false, message: "Kart veya Kullanıcı Bulunamadı!" };
      }
    } else {
      // Kart varsa sahibini bul
      student = students.find(s => String(s.id) === String(card.studentId));
      person = staff.find(s => String(s.id) === String(card.studentId));
    }

    const isStudent = !!student;
    const isStaff = !!person;

    if (!isStudent && !isStaff) return { success: false, message: "Kullanıcı Bulunamadı!" };
    
    // ÖNEMLİ KURAL: Sadece öğrenciler bakiye yetersizse engellenir. Personel eksiye düşebilir!
    if (isStudent && card.balance < amount) return { success: false, message: "Yetersiz Bakiye! (Sadece personel eksiye düşebilir)" };

    for (const item of cartItems) {
      const p = products.find(prod => String(prod.barcode) === String(item.barcode));
      if (!p || p.stock < item.quantity) return { success: false, message: `Hata: ${item.name} stokta kalmadı!` };
    }

    const newBalance = card.balance - amount;
    
    // Anlık Supabase Güncellemeleri
    await supabase.from('cards').update({ balance: newBalance }).eq('cardId', cardNo);
    
    const updatedProducts = products.map(p => {
      const item = cartItems.find(i => String(i.barcode) === String(p.barcode));
      if (item) return { ...p, stock: p.stock - item.quantity, saleCount: (p.saleCount || 0) + item.quantity };
      return p;
    });
    
    const transaction = {
      id: Date.now().toString(),
      cardId: cardNo,
      amount,
      items: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.discountedPrice || i.price, purchasePrice: i.purchasePrice || 0 })),
      date: new Date().toISOString()
    };
    
    await supabase.from('transactions').insert([transaction]);
    
    // Değişen ürünleri DB'ye gönder
    for(const item of cartItems) {
       const p = updatedProducts.find(prod => String(prod.barcode) === String(item.barcode));
       await supabase.from('products').update({ stock: p.stock, saleCount: p.saleCount }).eq('barcode', p.barcode);
    }

    // Eğer kart yeni oluşturulduysa cards array'ine ekle, yoksa güncelle
    const isNewCard = !cards.some(c => String(c.cardId) === String(cardNo));
    if (isNewCard) {
      _setCards([...cards, { ...card, balance: newBalance }]);
    } else {
      _setCards(cards.map(c => String(c.cardId) === String(cardNo) ? { ...c, balance: newBalance } : c));
    }
    
    _setProducts(updatedProducts);
    _setTransactions([transaction, ...transactions]);
    
    // YENİ: Sadece satılan ürünler için stok kontrolü yap
    checkStockLevels(updatedProducts.filter(p => cartItems.some(i => String(i.barcode) === String(p.barcode))));

    const userObj = student || person || { name: 'Bilinmeyen', surname: 'Kullanıcı' };
    await checkSuspiciousSpending(`${userObj.name} ${userObj.surname}`, Number(amount));

    return { success: true, message: `İşlem Başarılı! Yeni Bakiye: ${newBalance.toFixed(2)}₺` };
  };

  const addStaff = async (newPerson, initialBalance) => {
    const id = newPerson.id || uuidv4();
    const staffObj = { ...newPerson, id };
    const cardObj = { cardId: id, studentId: id, balance: Number(initialBalance), status: 'active' };
    
    const { error: staffErr } = await supabase.from('staff').upsert([staffObj]);
    if (staffErr) {
      console.error("Personel ekleme hatası:", staffErr.message, staffErr.details);
      return;
    }

    const { error: cardErr } = await supabase.from('cards').upsert([cardObj]);
    if (cardErr) {
      console.error("Kart ekleme hatası:", cardErr.message, cardErr.details);
      return;
    }
    
    _setStaff([...staff, staffObj]);
    _setCards([...cards, cardObj]);
  };

  const addStudent = async (newStudent) => {
    const cardObj = { cardId: newStudent.id, studentId: newStudent.id, balance: 0, status: 'active' };
    
    // 1. Önce Öğrenci (Parent)
    const { error: studentErr } = await supabase.from('students').upsert([newStudent]);
    if (studentErr) {
      console.error("Öğrenci ekleme hatası:", studentErr.message, studentErr.details);
      return { success: false, message: studentErr.message };
    }

    // 2. Sonra Kart (Child - Foreign Key)
    const { error: cardErr } = await supabase.from('cards').upsert([cardObj]);
    if (cardErr) {
      console.error("Kart ekleme hatası:", cardErr.message, cardErr.details);
      return { success: false, message: cardErr.message };
    }

    _setStudents([...students, newStudent]);
    _setCards([...cards, cardObj]);
    return { success: true };
  };

  const updateBalance = async (cardId, amount) => {
    const card = cards.find(c => c.cardId === cardId);
    if(card) {
      const newBal = card.balance + Number(amount);
      const { error } = await supabase.from('cards').update({ balance: newBal }).eq('cardId', cardId);
      if (error) {
        console.error("Bakiye güncelleme hatası:", error.message, error.details);
        alert("Bakiye güncellenemedi: " + error.message);
        return;
      }
      _setCards(cards.map(c => c.cardId === cardId ? { ...c, balance: newBal } : c));
    }
  };

  const deleteProduct = async (barcode) => {
    await supabase.from('products').delete().eq('barcode', barcode);
    _setProducts(products.filter(p => p.barcode !== barcode));
  };

  const deleteStaff = async (id) => {
    await supabase.from('cards').delete().eq('studentId', id);
    await supabase.from('staff').delete().eq('id', id);
    _setStaff(staff.filter(s => String(s.id) !== String(id)));
    _setCards(cards.filter(c => String(c.studentId) !== String(id)));
  };

  const deleteStudent = async (id) => {
    await supabase.from('cards').delete().eq('studentId', id);
    await supabase.from('students').delete().eq('id', id);
    _setStudents(students.filter(s => String(s.id) !== String(id)));
    _setCards(cards.filter(c => String(c.studentId) !== String(id)));
  };

  const applyDiscount = async (barcode, percent) => {
    const p = products.find(x => x.barcode === barcode);
    if(p) {
      const newPrice = p.price * (1 - percent / 100);
      await supabase.from('products').update({ discountedPrice: newPrice }).eq('barcode', barcode);
      _setProducts(products.map(x => x.barcode === barcode ? { ...x, discountedPrice: newPrice } : x));
    }
  };
  
  const removeDiscount = async (barcode) => {
    await supabase.from('products').update({ discountedPrice: null, isSKTDiscounted: false }).eq('barcode', barcode);
    _setProducts(products.map(p => p.barcode === barcode ? { ...p, discountedPrice: null, isSKTDiscounted: false } : p));
  };

  const exportToExcel = (data, filename) => {
    if (!window.XLSX) return alert("Excel kütüphanesi yüklenemedi!");
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Rapor");
    window.XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const backupData = () => {
    const data = { products, students, staff, cards, transactions, announcements, wishes, wastage };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kantin_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const restoreData = () => { alert("Veriler artık Supabase veritabanında güvenle tutulmaktadır."); };

  const resetAllData = async () => {
    try {
      const tables = ['products', 'students', 'staff', 'cards', 'transactions', 'notifications', 'wishes', 'announcements'];
      for (const table of tables) {
        await supabase.from(table).delete().neq('id', 'placeholder_to_match_all');
        // Note: For some tables like products/cards, the PK might be barcode/cardId
        if (table === 'products') await supabase.from(table).delete().neq('barcode', '0');
        if (table === 'cards') await supabase.from(table).delete().neq('cardId', '0');
      }
      
      // Reset local states
      _setProducts([]);
      _setStudents([]);
      _setStaff([]);
      _setCards([]);
      _setTransactions([]);
      _setAnnouncements([]);
      _setWishes([]);
      setNotifications([]);
      setPredictions([]);
      
      return { success: true };
    } catch (error) {
      console.error("Sıfırlama hatası:", error);
      return { success: false, message: error.message };
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider value={{
      products, setProducts, students, setStudents, staff, setStaff, cards, setCards,
      transactions, setTransactions, wishes, setWishes, announcements, setAnnouncements,
      wastage, setWastage, favorites, setFavorites, language, setLanguage, processSaleV14, exportToExcel,
      addStaff, addStudent, updateBalance, deleteProduct, applyDiscount, removeDiscount, 
      deleteStaff, deleteStudent, backupData, restoreData, loading,
      syncDynamicPrices, getStockPredictions, predictions,
      notifications, fetchNotifications, readAllNotifications, recordLogin, resetAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
