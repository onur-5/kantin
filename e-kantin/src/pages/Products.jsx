import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../utils/translations';

export const Products = () => {
  const { products, setProducts, deleteProduct, language } = useData();
  const t = translations[language] || translations['TR'];
  const showToast = useToast();
  
  const [newProduct, setNewProduct] = useState({
    barcode: '', name: '', price: '', purchasePrice: '', stock: '', threshold: 5, expirationDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.barcode || !newProduct.name || !newProduct.price) return;
    
    const product = {
      ...newProduct,
      price: Number(newProduct.price),
      purchasePrice: Number(newProduct.purchasePrice || (newProduct.price * 0.7)),
      stock: Number(newProduct.stock),
      threshold: Number(newProduct.threshold),
      saleCount: 0
    };

    setProducts([...products, product]);
    setNewProduct({ barcode: '', name: '', price: '', purchasePrice: '', stock: '', threshold: 5, expirationDate: '' });
    showToast(language === 'TR' ? "Ürün eklendi!" : "Product added!", "success");
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="row g-4 animate-fade-in py-4">
      {/* ÜRÜN EKLEME FORMU */}
      <div className="col-md-4">
        <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
          <h5 className="fw-bold mb-4 text-primary">Yeni Ürün Ekle</h5>
          <form onSubmit={handleAddProduct}>
            <div className="mb-3">
              <label className="small fw-bold mb-1">Barkod</label>
              <input type="text" className="form-control rounded-pill px-3" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="small fw-bold mb-1">Ürün Adı</label>
              <input type="text" className="form-control rounded-pill px-3" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="small fw-bold mb-1">Alış Fiyatı (₺)</label>
                <input type="number" className="form-control rounded-pill px-3" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} />
              </div>
              <div className="col-6">
                <label className="small fw-bold mb-1">Satış Fiyatı (₺)</label>
                <input type="number" className="form-control rounded-pill px-3" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="small fw-bold mb-1">Son Kullanma Tarihi</label>
              <input type="date" className="form-control rounded-pill px-3" value={newProduct.expirationDate} onChange={e => setNewProduct({...newProduct, expirationDate: e.target.value})} />
            </div>
            <div className="row g-2 mb-4">
              <div className="col-12">
                <label className="small fw-bold mb-1">Stok Adedi</label>
                <input type="number" className="form-control rounded-pill px-3" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow">KAYDET</button>
          </form>
        </div>
      </div>

      {/* ÜRÜN LİSTESİ */}
      <div className="col-md-8">
        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">Envanter Listesi</h5>
            <div className="input-group" style={{ maxWidth: '250px' }}>
              <span className="input-group-text border-0 rounded-start-pill"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control border-0 rounded-end-pill" placeholder="Ürün veya barkod ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="text-secondary small">
                <tr>
                  <th className="ps-4">Barkod / Ürün</th>
                  <th>Fiyat (₺)</th>
                  <th>SKT</th>
                  <th>Stok</th>

                  <th className="pe-4 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const today = new Date();
                  const expDate = p.expirationDate ? new Date(p.expirationDate) : null;
                  const isNearExpiry = expDate && Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)) <= 2;

                  return (
                    <tr key={p.barcode} className={isNearExpiry ? 'bg-danger bg-opacity-10' : ''}>
                      <td className="ps-4 py-3">
                        <div className="small text-muted">{p.barcode}</div>
                        <div className="fw-bold d-flex align-items-center">
                          {p.name}
                          {isNearExpiry && (
                            <span className="badge bg-danger ms-2 animate-pulse" title="SKT Yaklaşıyor!">
                              <i className="bi bi-hourglass-split"></i>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={`fw-bold ${p.discountedPrice ? 'text-danger' : 'text-primary'}`}>
                          {(p.discountedPrice || p.price).toFixed(2)}
                          {p.discountedPrice && <small className="ms-1 text-muted text-decoration-line-through">{p.price.toFixed(2)}</small>}
                        </div>
                      </td>
                      <td>
                        <div className={`small fw-bold ${isNearExpiry ? 'text-danger' : 'text-muted'}`}>
                          {p.expirationDate || '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${p.stock <= (p.threshold || 5) ? 'bg-danger' : 'bg-success bg-opacity-75'}`}>
                          {p.stock}
                        </span>
                      </td>

                      <td className="pe-4 text-end">
                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => deleteProduct(p.barcode)}>
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
