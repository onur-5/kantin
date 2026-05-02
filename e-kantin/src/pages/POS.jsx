import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../utils/translations';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const POS = () => {
  // 🛡️ Zırhlı Veri Çekimi (Destructuring with Defaults)
  const { 
    products = [], 
    processSaleV14, 
    cards = [], 
    students = [], 
    staff = [], 
    language = 'TR', 
    transactions = [], 
    favorites = [] 
  } = useData();
  
  const t = translations[language] || translations['TR'];
  const showToast = useToast();
  
  const [cart, setCart] = useState([]);
  const [cardNo, setCardNo] = useState('');
  const [showQR, setShowQR] = useState(false);

  // GÜNÜN MENÜSÜ OTOMASYONU (Stok Korumalı)
  const unsoldItems = products.filter(p => !p.lastSaleDate && (p.stock || 0) > 0).slice(0, 3);
  const fastPack = unsoldItems.length >= 2 ? unsoldItems : products.filter(p => (p.stock || 0) > 0).slice(0, 2);

  // Toplam Tutar Hesaplama (İndirim Korumalı)
  const totalAmount = cart.reduce((sum, item) => {
    const price = item.discountedPrice || item.price || 0;
    return sum + (price * item.quantity);
  }, 0);
  
  const addToCart = (product) => {
    const pStock = product.stock || 0;
    
    // 🛡️ STOK KORUMASI
    if (pStock <= 0) {
      return showToast(language === 'TR' ? "Hata: Ürün tükendi!" : "Error: Out of stock!", "danger");
    }

    const existing = cart.find(i => String(i.barcode) === String(product.barcode));
    if (existing) {
      if (existing.quantity >= pStock) {
        return showToast(language === 'TR' ? "Yetersiz stok!" : "Insufficient stock!", "warning");
      }
      setCart(cart.map(i => String(i.barcode) === String(product.barcode) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (barcode) => {
    setCart(prev => prev.filter(item => String(item.barcode) !== String(barcode)));
  };

  const updateQuantity = (barcode, delta) => {
    setCart(prev => {
      const item = prev.find(i => String(i.barcode) === String(barcode));
      if (!item) return prev;
      
      const newQty = item.quantity + delta;
      
      if (newQty <= 0) {
        return prev.filter(i => String(i.barcode) !== String(barcode));
      }
      
      // Stock check for increase
      const product = products.find(p => String(p.barcode) === String(barcode));
      if (delta > 0 && product && newQty > (product.stock || 0)) {
        showToast(language === 'TR' ? "Yetersiz stok!" : "Insufficient stock!", "warning");
        return prev;
      }
      
      return prev.map(i => String(i.barcode) === String(barcode) ? { ...i, quantity: newQty } : i);
    });
  };

  const addFastPack = () => {
    if (fastPack.length === 0) return showToast("Günün menüsü için uygun ürün yok.", "warning");
    fastPack.forEach(p => addToCart(p));
    showToast("Hızlı paket eklendi.", "info");
  };

  const smartParseQR = (input) => {
    if (!input) return "";
    const cleanInput = String(input).trim();
    if (cleanInput.includes('/') && cleanInput.startsWith('http')) {
      const parts = cleanInput.split('/');
      return parts[parts.length - 1];
    }
    return cleanInput;
  };

  const handleCheckout = async (manualCardNo) => {
    const cleanId = smartParseQR(manualCardNo || cardNo);
    if (!cleanId || cart.length === 0) return;

    // 🛡️ BEYAZ EKRAN KORUMASI: Try-Catch Bloğu
    try {
      const result = await processSaleV14(cleanId, totalAmount, cart);

      if (result.success) {
        window.Swal.fire({
          title: language === 'TR' ? "İşlem Başarılı" : "Success",
          text: result.message,
          icon: "success",
          confirmButtonText: 'Tamam'
        });
        setCart([]);
        setCardNo('');
        setShowQR(false);
      } else {
        window.Swal.fire({ title: "Hata", text: result.message, icon: "error" });
      }
    } catch (error) {
      console.error("Kritik Satış Hatası:", error);
      showToast("İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", "danger");
    }
  };

  useEffect(() => {
    if (showQR) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((decodedText) => {
        const cleanId = smartParseQR(decodedText);
        setCardNo(cleanId);
        scanner.clear();
        setShowQR(false);
        setTimeout(() => handleCheckout(cleanId), 100);
      }, (err) => {});
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [showQR]);

  // 🛡️ ZIRHLI SORGULAR: String karşılaştırması
  const cleanSelectedId = smartParseQR(cardNo);
  const selectedCard = cards.find(c => String(c.cardId) === String(cleanSelectedId));
  const student = students.find(s => String(s.id) === String(selectedCard?.studentId));
  const person = staff.find(st => String(st.id) === String(selectedCard?.studentId));
  
  const spentToday = student ? transactions
    .filter(t => String(t.cardId) === String(selectedCard?.cardId) && String(t.date).startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) : 0;

  return (
    <div className="row g-4 animate-fade-in py-4">
      <div className="col-md-8">
        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">{t.pos}</h4>
            <button className="btn btn-warning fw-bold rounded-pill shadow-sm" onClick={addFastPack} disabled={fastPack.length === 0}>
              <i className="bi bi-lightning-fill me-2"></i>Günün Menüsü
            </button>
          </div>
          <div className="row row-cols-1 row-cols-md-3 g-3">
            {products.map(p => {
              // 🛡️ FAVORİ KONTROLÜ: Null koruması eklendi
              const isFav = favorites.some(f => String(f.studentId) === String(selectedCard?.studentId) && String(f.barcode) === String(p.barcode));
              const pStock = p.stock || 0;
              const displayPrice = p.discountedPrice || p.price;

              return (
                <div key={p.barcode} className="col">
                  <div 
                    className={`card h-100 border-0 p-3 shadow-sm cursor-pointer transition-all ${pStock <= 0 ? 'opacity-50 grayscale' : 'scale-hover'} ${p.discountedPrice ? 'border-top border-danger border-4' : ''} ${isFav ? 'border-warning border-3 bg-warning bg-opacity-10' : ''}`} 
                    onClick={() => addToCart(p)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="fw-bold">{p.name}</div>
                      {isFav && <i className="bi bi-star-fill text-warning"></i>}
                    </div>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <div>
                        {p.discountedPrice ? (
                          <span className="text-danger fw-bold">{displayPrice.toFixed(2)} ₺</span>
                        ) : (
                          <span className="text-primary fw-bold">{displayPrice} ₺</span>
                        )}
                      </div>
                      <span className={`badge border ${pStock <= 5 ? 'bg-danger' : 'text-secondary'}`}>{pStock}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-0 shadow-lg rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
          <h5 className="fw-bold mb-4 d-flex justify-content-between">
            {t.cartSummary}
            <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => setShowQR(!showQR)}>
               <i className="bi bi-qr-code-scan me-1"></i> QR
            </button>
          </h5>

          {showQR && <div id="reader" className="mb-3"></div>}

          {selectedCard && (
            <div className={`alert ${student?.dailyLimit > 0 && spentToday >= student.dailyLimit ? 'alert-danger' : 'alert-info'} rounded-4 border-0 mb-4`}>
              <div className="fw-bold">{student?.name || person?.name} {student?.surname || person?.surname}</div>
              <div className="small">Bakiye: {(selectedCard?.balance || 0).toFixed(2)} ₺</div>
              {student?.dailyLimit > 0 && <div className="x-small fw-bold mt-1">Harcanan: {spentToday}/{student.dailyLimit} ₺</div>}
            </div>
          )}

          <div className="mb-4 overflow-auto" style={{ maxHeight: '250px' }}>
            {cart.map(item => {
              const itemPrice = item.discountedPrice || item.price;
              return (
                <div key={item.barcode} className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <button 
                      className="btn btn-sm btn-outline-danger border-0 p-1" 
                      onClick={() => removeFromCart(item.barcode)}
                      title="Ürünü Çıkar"
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                    <div className="small">
                      <div className="fw-bold">{item.name}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <button className="btn btn-xs btn-outline-secondary px-2 py-0" onClick={() => updateQuantity(item.barcode, -1)}>-</button>
                        <span className="fw-bold">{item.quantity}</span>
                        <button className="btn btn-xs btn-outline-secondary px-2 py-0" onClick={() => updateQuantity(item.barcode, 1)}>+</button>
                        <span className="text-muted ms-1">x {itemPrice} ₺</span>
                      </div>
                    </div>
                  </div>
                  <span className="fw-bold">{itemPrice * item.quantity} ₺</span>
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-between mb-4 pt-3 border-top">
            <span className="fw-bold fs-5">{t.total}:</span>
            <span className="fw-bold fs-4 text-primary">{totalAmount.toFixed(2)} ₺</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
            <input 
              type="text" 
              className="form-control form-control-lg text-center fw-bold mb-3 border-0" 
              placeholder="KART OKUTUN"
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              required
            />
            <button className="btn btn-success btn-lg w-100 fw-bold rounded-pill shadow" disabled={cart.length === 0}>
              SATIŞI TAMAMLA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
