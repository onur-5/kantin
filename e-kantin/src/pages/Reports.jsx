import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const Reports = () => {
  const { transactions, products, language } = useData();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Local rapor hesaplama
    const calculateReport = () => {
      try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const filteredTransactions = transactions.filter(t => new Date(t.date) >= last7Days);
        
        let totalRev = 0;
        let totalC = 0;
        const productStats = {};

        filteredTransactions.forEach(t => {
          totalRev += Number(t.amount) || 0;
          (t.items || []).forEach(item => {
            // Rapor için maliyet hesabı
            const p = products.find(prod => prod.barcode === item.barcode || prod.name === item.name);
            const pPrice = Number(item.price) || (p?.price || 0);
            const pPurchasePrice = p?.purchasePrice || (pPrice * 0.7);
            
            totalC += (pPurchasePrice * (item.quantity || 1));
            
            if (productStats[item.name]) {
              productStats[item.name] += item.quantity || 1;
            } else {
              productStats[item.name] = item.quantity || 1;
            }
          });
        });

        const top = Object.entries(productStats)
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        setReportData({
          totalRevenue: totalRev,
          totalCost: totalC,
          netProfit: totalRev - totalC,
          topProducts: top
        });
        setLoading(false);
      } catch (error) {
        console.error("Rapor hesaplama hatası:", error);
        setLoading(false);
      }
    };

    if (transactions) {
      calculateReport();
    }
  }, [transactions, products]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Antet
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("ÜMRANİYE OKUL KANTİNİ", 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("Haftalık Finansal Özet Raporu", 105, 25, { align: 'center' });
    doc.line(20, 30, 190, 30);

    // Özet Bilgiler
    doc.setFontSize(11);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 40);
    doc.text(`Toplam Ciro: ${reportData.totalRevenue.toLocaleString()} TL`, 20, 50);
    doc.text(`Toplam Maliyet: ${reportData.totalCost.toLocaleString()} TL`, 20, 60);
    doc.setFontSize(12);
    doc.setTextColor(reportData.netProfit >= 0 ? 'green' : 'red');
    doc.text(`NET KÂR: ${reportData.netProfit.toLocaleString()} TL`, 20, 75);

    // Tablo (En Çok Satanlar)
    doc.autoTable({
      startY: 85,
      head: [['Ürün Adı', 'Satış Adedi']],
      body: reportData.topProducts.map(p => [p.name, p.qty]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("Kantin_Haftalik_Rapor.pdf");
  };

  if (loading || !reportData) return <div className="p-5 text-center">Rapor Hazırlanıyor...</div>;

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="mb-4">
        <h3 className="fw-bold text-dark">Haftalık Finansal Rapor</h3>
        <p className="text-muted">İşletmenizin son 7 günlük mali röntgeni.</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-primary border-5">
            <small className="text-uppercase fw-bold text-muted">Toplam Ciro</small>
            <h2 className="fw-bold text-primary mb-0">{reportData.totalRevenue.toLocaleString()} ₺</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-warning border-5">
            <small className="text-uppercase fw-bold text-muted">Toplam Maliyet</small>
            <h2 className="fw-bold text-warning mb-0">{reportData.totalCost.toLocaleString()} ₺</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card border-0 shadow-sm rounded-4 p-4 bg-white border-start ${reportData.netProfit >= 0 ? 'border-success' : 'border-danger'} border-5`}>
            <small className="text-uppercase fw-bold text-muted">Net Kâr</small>
            <h2 className={`fw-bold mb-0 ${reportData.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{reportData.netProfit.toLocaleString()} ₺</h2>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-dark text-white p-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">En Çok Satan Ürünler</h6>
              <i className="bi bi-trophy-fill text-warning"></i>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr><th>Ürün</th><th className="text-center">Satış Adedi</th></tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="ps-4 fw-bold">{p.name}</td>
                      <td className="text-center"><span className="badge bg-primary rounded-pill">{p.qty}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-lg rounded-4 p-4 bg-primary text-white h-100 d-flex flex-column justify-content-center align-items-center text-center">
            <i className="bi bi-file-earmark-pdf fs-1 mb-3"></i>
            <h4>Profesyonel Rapor</h4>
            <p className="small opacity-75">Haftalık finansal verilerinizi kurumsal formatta PDF olarak indirin.</p>
            <button className="btn btn-light btn-lg rounded-pill fw-bold shadow-sm mt-3 w-100" onClick={downloadPDF}>
              PDF OLARAK İNDİR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
