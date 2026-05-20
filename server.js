const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());
const fs = require('fs');
const path = require('path');
const UAParser = require('ua-parser-js');

// 0. GÜVENLİK TAKİP (Bellek üzerinde son IP'ler)
const userLastIPs = {};

// 0. BİLDİRİM VERİTABANI (Dosya tabanlı)
const notifFilePath = path.join(__dirname, 'notifications.json');
if (!fs.existsSync(notifFilePath)) {
  fs.writeFileSync(notifFilePath, JSON.stringify([
    { id: 1, category: 'Sistem', message: 'Kantin Yönetim Sistemi Başlatıldı.', type: 'info', createdAt: new Date().toISOString(), isRead: false }
  ]));
}

const getNotifications = () => JSON.parse(fs.readFileSync(notifFilePath, 'utf8'));
const saveNotifications = (data) => fs.writeFileSync(notifFilePath, JSON.stringify(data, null, 2));

const addNotification = (category, message, type) => {
  const notifications = getNotifications();
  const newNotif = {
    id: Date.now(),
    category,
    message,
    type,
    createdAt: new Date().toISOString(),
    isRead: false
  };
  const updated = [newNotif, ...notifications];
  saveNotifications(updated);
  return newNotif;
};

// 1. GÜVENLİ VE GÜNCEL NODEMAILER TRANSPORTER AYARI
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Port 465 için mutlaka true olmalı
  auth: {
    user: 'onurseyfeddin83@gmail.com', 
    pass: 'nafd cicl dwwq cghr' 
  },
  tls: {
    rejectUnauthorized: false // Sertifika hatalarını önlemek için eklendi
  }
});

// 3. SMTP BAĞLANTI TESTİ (Sunucu başlarken çalışır)
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Bağlantı Hatası:", error);
  } else {
    console.log("✅ Sunucu mail göndermeye hazır! (SMTP Başarılı)");
  }
});

// 4. WHATSAPP BOT AYARI
const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox']
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('📱 WHATSAPP BİLDİRİM BOTU İÇİN AŞAĞIDAKİ QR KODU OKUTUN:');
    qrcode.generate(qr, {small: true});
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Bot başarıyla bağlandı ve kullanıma hazır!');
});

whatsappClient.initialize();

// 2. GÜNCELLENMİŞ API ROTASI (ENDPOINT)
app.post('/api/send-reminders', async (req, res) => {
  const { borclular } = req.body;

  // Gelen liste kontrolü
  if (!borclular || !Array.isArray(borclular) || borclular.length === 0) {
    return res.status(400).json({ error: 'Gönderilecek geçerli bir borçlu listesi bulunamadı.' });
  }

  try {
    let basarili = 0;
    let basarisiz = 0;

    // Hata yönetimini iyi takip etmek için for...of döngüsü
    for (const member of borclular) {
      if (!member.email) continue;

      const mailOptions = {
        from: '"Kantin Otomasyon" <onurseyfeddin83@gmail.com>',
        to: member.email,
        subject: 'Kantin Bakiye / Borç Hatırlatması',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d32f2f;">Kantin Borç Hatırlatması</h2>
            <p>Sayın <strong>${member.name} ${member.surname || ''}</strong>,</p>
            <p>Sistemimizde yapılan kontrollerde bakiyenizin eksiye düştüğü görülmektedir.</p>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ff9800;">
              <p style="margin: 0; font-size: 18px;">Güncel Borcunuz: <strong>${Math.abs(member.balance || member.bakiye || 0)} TL</strong></p>
            </div>
            <p>Lütfen en kısa sürede kantine uğrayarak ödemenizi gerçekleştiriniz ve bakiyenizi güncelleyiniz.</p>
            <p>İyi çalışmalar dileriz.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">Bu e-posta otomatik bir hatırlatmadır, lütfen yanıtlamayınız.</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        basarili++;
      } catch (err) {
        // Hata terminalde net şekilde görülecek
        console.error(`MAİL GÖNDERME HATASI DETAYI (${member.email} için):`, err);
        basarisiz++;
      }
    }

    res.status(200).json({ 
      message: 'Hatırlatma işlemi tamamlandı.', 
      sonuc: { basarili, basarisiz }
    });

  } catch (error) {
    console.error("GENEL MAİL GÖNDERME HATASI:", error);
    res.status(500).json({ error: 'Sistem düzeyinde bir hata oluştu.', details: error.message });
  }
});

// 5. WHATSAPP GÖNDERİM ROTASI
app.post('/api/send-whatsapp', async (req, res) => {
  const { borclular } = req.body;

  if (!borclular || !Array.isArray(borclular) || borclular.length === 0) {
    return res.status(400).json({ error: 'Gönderilecek geçerli bir borçlu listesi bulunamadı.' });
  }

  let basarili = 0;
  let basarisiz = 0;

  for (const member of borclular) {
    if (!member.phone) continue;
    
    // Telefon numarasını +90 formatına çevir
    let phone = member.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '90' + phone; 
    if (phone.length === 11 && phone.startsWith('0')) phone = '9' + phone; 
    
    const chatId = phone + '@c.us';
    const message = `Sayın ${member.name} ${member.surname || ''},\n\nE-Kantin sistemindeki güncel borcunuz ${Math.abs(member.balance || member.bakiye || 0)} TL'dir. Lütfen ödeme yapınız.\n\nİyi günler dileriz.`;
    
    try {
        await whatsappClient.sendMessage(chatId, message);
        basarili++;
    } catch (error) {
        console.error(`WhatsApp gönderim hatası (${member.name}):`, error);
        basarisiz++;
    }
  }
  
  res.status(200).json({ message: 'WhatsApp işlemi tamamlandı', sonuc: { basarili, basarisiz } });
});

// 6. İSTATİSTİK VE ANALİZ ROTASI
app.post('/api/stats', (req, res) => {
  const { members, cards, transactions } = req.body;
  
  const aktifUye = members?.length || 0;
  
  let toplamBorc = 0;
  let personelBakiye = 0;
  let ogrenciBakiye = 0;
  
  (cards || []).forEach(card => {
      if (card.balance < 0) {
          toplamBorc += Math.abs(card.balance);
      }
      
      const member = (members || []).find(m => String(m.id) === String(card.studentId));
      if (member) {
          if (member.role === 'student' || member.type === 'Öğrenci') ogrenciBakiye += card.balance;
          else personelBakiye += card.balance;
      }
  });
  
  // Son 7 günlük işlem hacmi
  const yediGunOnce = new Date();
  yediGunOnce.setDate(yediGunOnce.getDate() - 7);
  
  const islemHacmi = (transactions || [])
      .filter(t => new Date(t.date || t.createdAt) >= yediGunOnce)
      .reduce((sum, t) => sum + Math.abs(t.amount || t.total || 0), 0);
      
  res.status(200).json({
      aktifUye,
      toplamBorc,
      islemHacmi,
      dagilim: { personel: personelBakiye, ogrenci: ogrenciBakiye }
  });
});

// 7. GOOGLE STYLE HAVA DURUMU ROTASI
app.get('/api/weather-forecast', async (req, res) => {
  try {
    const url = 'https://api.openweathermap.org/data/2.5/forecast?q=Istanbul&appid=e3d2b0fbc1622b9328b03de71777a4a5&units=metric&lang=tr';
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      return res.status(400).json({ error: 'Hava durumu verisi çekilemedi' });
    }

    // Mevcut hava durumu (listedeki ilk eleman)
    const current = data.list[0];

    // Günlük tahminleri (sadece öğlen 12:00 civarı veya en yakın verileri) ayıklama
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const dateStr = item.dt_txt.split(' ')[0]; // 'YYYY-MM-DD'
      
      // Eğer bu gün için henüz veri yoksa veya saat 12:00:00 ise kaydet
      if (!dailyForecasts[dateStr] || item.dt_txt.includes('12:00:00')) {
        // En yüksek/en düşük sıcaklığı güncelleyelim
        if (!dailyForecasts[dateStr]) {
            dailyForecasts[dateStr] = {
                ...item,
                temp_max: item.main.temp_max,
                temp_min: item.main.temp_min
            };
        } else {
            // Sadece sıcaklık değerlerini kıyaslayıp max/min bulalım
            dailyForecasts[dateStr].temp_max = Math.max(dailyForecasts[dateStr].temp_max, item.main.temp_max);
            dailyForecasts[dateStr].temp_min = Math.min(dailyForecasts[dateStr].temp_min, item.main.temp_min);
            if (item.dt_txt.includes('12:00:00')) {
                dailyForecasts[dateStr].weather = item.weather; // İkonu öğlene göre al
            }
        }
      }
    });

    // Objeyi diziye çevirip ilk 5 günü al
    const forecastArray = Object.values(dailyForecasts).slice(0, 5).map(item => {
      const dateObj = new Date(item.dt_txt);
      const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      
      return {
        dayName: days[dateObj.getDay()],
        temp_max: Math.round(item.temp_max),
        temp_min: Math.round(item.temp_min),
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        isRainy: item.weather[0].main.toLowerCase().includes('rain')
      };
    });

    const isTomorrowRainy = forecastArray[1] && forecastArray[1].isRainy;

    res.status(200).json({
      current: {
        temp: Math.round(current.main.temp),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        wind: Math.round(current.wind.speed * 3.6), // m/s to km/h
        rain_prob: Math.round((current.pop || 0) * 100)
      },
      forecast: forecastArray,
      suggestion: isTomorrowRainy 
        ? "⚠️ Yarın yağış bekleniyor, sıcak içecek (Çay/Kahve) hazırlığını artırın."
        : "☀️ Yarın hava güzel, soğuk içecek satışları artabilir."
    });

  } catch (error) {
    console.error("Hava durumu API hatası:", error);
    res.status(500).json({ error: 'Hava durumu alınamadı' });
  }
});

// 9. DİNAMİK FİYATLANDIRMA MOTORU
app.post('/api/calculate-prices', (req, res) => {
  const { products } = req.body;
  if (!products) return res.status(400).json({ error: 'Ürün listesi gerekli.' });

  const updatedProducts = products.map(p => {
    let multiplier = 1;
    let trend = 'stable'; // 'up', 'down', 'stable'

    if (p.stock < 10 && p.stock > 0) {
      multiplier = 1.20; // %20 zam
      trend = 'up';
    } else if (p.stock > 50) {
      multiplier = 0.85; // %15 indirim
      trend = 'down';
    }

    return {
      ...p,
      basePrice: p.basePrice || p.price, // Orijinal fiyatı koru
      price: Number(( (p.basePrice || p.price) * multiplier ).toFixed(2)),
      priceTrend: trend
    };
  });

  res.json(updatedProducts);
});

// 10. BURN RATE & STOK TAHMİNLEME (AI Destekli Analiz)
app.post('/api/predict-stock', (req, res) => {
  const { products, salesHistory } = req.body;
  if (!products || !salesHistory) return res.status(400).json({ error: 'Veri eksik.' });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  const predictions = products.map(p => {
    // Son 7 gündeki satışlarını filtrele (DÜZELTME: Items içinde ara)
    let totalSold = 0;
    salesHistory.filter(s => new Date(s.date) > sevenDaysAgo).forEach(s => {
      const item = s.items?.find(i => i.barcode === p.barcode || i.name === p.name);
      if (item) totalSold += (Number(item.quantity) || 1);
    });

    const dailyVelocity = totalSold / 7;
    let remainingDays = dailyVelocity > 0 ? (p.stock / dailyVelocity) : 999;
    let status = 'safe'; // 'critical', 'warning', 'safe'
    
    if (remainingDays <= 1) status = 'critical'; // 24 saatten az
    else if (remainingDays <= 3) status = 'warning';

    return {
      barcode: p.barcode,
      name: p.name,
      stock: p.stock,
      dailyVelocity: dailyVelocity.toFixed(2),
      remainingDays: remainingDays === 999 ? '∞' : remainingDays.toFixed(1),
      status
    };
  });

  // EK: Satılmayan Ürün Kontrolü (Haftalık Analiz)
  products.forEach(p => {
    let wasSold = false;
    salesHistory.filter(s => new Date(s.date) > sevenDaysAgo).forEach(s => {
      if (s.items?.some(i => i.barcode === p.barcode || i.name === p.name)) wasSold = true;
    });

    if (!wasSold && p.stock > 0) {
      addNotification('Sistem', `DURGUN STOK: ${p.name} son 7 gündür hiç satılmadı! İndirim yapmayı düşünün.`, 'info');
    }
  });

  res.json(predictions);
});

// 8. AI KALORİ TAHMİN ROTASI (GROQ)
const groq = new Groq({ apiKey: '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' });

app.post('/api/estimate-calories', async (req, res) => {
  const { productName } = req.body;
  if (!productName) return res.status(400).json({ error: 'Ürün adı gerekli.' });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sen bir beslenme uzmanısın. Kullanıcının verdiği ürünün yaklaşık kalorisini tahmin edersin. Sadece rakam (sayı) döndür. Eğer girdi bir yiyecek veya içecek değilse (anlamsız harflerse) sadece '0' döndür. Başka hiçbir metin yazma."
        },
        {
          role: "user",
          content: productName
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    let result = chatCompletion.choices[0].message.content.trim();
    // Sadece sayıları al
    const calories = result.match(/\d+/) ? result.match(/\d+/)[0] : "0";

    res.status(200).json({ calories: calories === "0" ? null : calories });
  } catch (error) {
    console.error("Groq API Hatası:", error);
    res.status(500).json({ error: 'AI tahmini yapılamadı.' });
  }
});

// 11. BİLDİRİM VE RAPORLAMA ROTARLARI
app.get('/api/notifications', (req, res) => {
  res.json(getNotifications());
});

app.post('/api/notifications/read-all', (req, res) => {
  const notifications = getNotifications().map(n => ({ ...n, isRead: true }));
  saveNotifications(notifications);
  res.json({ success: true });
});

// HAFTALIK FİNANSAL RAPOR API
app.get('/api/reports/weekly', (req, res) => {
  const { transactions } = req.query; // Frontend'den gelen son işlemler
  const parsedTransactions = JSON.parse(transactions || '[]');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklySales = parsedTransactions.filter(t => new Date(t.date) > sevenDaysAgo);
  
  let totalRevenue = 0;
  let totalCost = 0;
  const productSales = {};

  weeklySales.forEach(sale => {
    totalRevenue += Number(sale.amount);
    sale.items?.forEach(item => {
      totalCost += (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 1);
      productSales[item.name] = (productSales[item.name] || 0) + (Number(item.quantity) || 1);
    });
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, qty]) => ({ name, qty }));

  res.json({
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    topProducts,
    period: "Son 7 Gün"
  });
});

// GÜVENLİ GİRİŞ API (Cihaz ve IP Takibi)
app.post('/api/auth/login', (req, res) => {
  const { username, role } = req.body;
  console.log(`🔐 GİRİŞ İSTEĞİ GELDİ: ${username} (${role})`);

  // IP adresi yakalama ve localhost kontrolü
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = rawIp === '::1' ? 'Localhost' : rawIp;

  // Kullanıcı ajanını ayrıştır
  const parser = new UAParser(req.headers['user-agent'] || '');
  const ua = parser.getResult();
  const deviceInfo = `${ua.browser.name || 'Tarayıcı'} - ${ua.os.name || 'OS'} ${ua.os.version || ''}`.trim();

  // Bildirim mesajı (her zaman IP ve cihaz bilgisiyle)
  const message = `🛡️ Güvenlik: ${username} adlı kullanıcı, ${deviceInfo} üzerinden ${ip} ile giriş yaptı.`;
  addNotification('Sistem', message, 'info');
  console.log(`✅ BİLDİRİM OLUŞTURULDU: ${message}`);

  res.json({
    success: true,
    ip,
    deviceInfo,
    notifications: getNotifications()
  });
});

// Şüpheli Harcama ve SKT Kontrolü
app.post('/api/check-suspicious-spending', (req, res) => {
  const { studentName, amount, products } = req.body;
  
  // 1. Harcama Kontrolü
  if (Number(amount) >= 100) {
    addNotification('Öğrenci', `YÜKSEK HARCAMA: ${studentName} tek seferde ${amount} TL harcadı!`, 'danger');
  }

  // 2. SKT Kontrolü (Gelen ürün listesi üzerinden)
  if (products && Array.isArray(products)) {
    const today = new Date();
    products.forEach(p => {
      if (p.expirationDate) {
        const expDate = new Date(p.expirationDate);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2 && diffDays > 0) {
          addNotification('Sistem', `⚠️ SKT YAKLAŞIYOR: ${p.name} ürününe %50 indirim uygulandı! (Kalan: ${diffDays} gün)`, 'warning');
        }
      }
    });
  }

  res.json({ checked: true, notifications: getNotifications() });
});

// SUNUCUYU BAŞLAT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend sunucusu http://localhost:${PORT} portunda çalışıyor...`));
