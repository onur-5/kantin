const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// NODEMAILER TRANSPORTER AYARI
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'onurseyfeddin83@gmail.com', // Kullanıcı buraya kendi mailini yazacak
    pass: 'nafd cicl dwwq cghr'       // Kullanıcı buraya 16 haneli uygulama şifresini yazacak
  }
});

// API ROTASI (ENDPOINT)
app.post('/api/send-reminders', async (req, res) => {
  const { borclular } = req.body;

  if (!borclular || !Array.isArray(borclular)) {
    return res.status(400).json({ error: 'Geçersiz veri formatı.' });
  }

  try {
    // Tüm borçlulara tek tek mail gönderimi (Promise.all ile paralel)
    const emailPromises = borclular.map(member => {
      const mailOptions = {
        from: '"Kantin Otomasyon" <KENDI_MAIL_ADRESIN@gmail.com>',
        to: member.email,
        subject: 'Kantin Bakiye / Borç Hatırlatması',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d32f2f;">Kantin Borç Hatırlatması</h2>
            <p>Sayın <strong>${member.name}</strong>,</p>
            <p>Sistemimizde yapılan kontrollerde bakiyenizin eksiye düştüğü görülmektedir.</p>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ff9800;">
              <p style="margin: 0; font-size: 18px;">Güncel Borcunuz: <strong>${Math.abs(member.balance)} TL</strong></p>
            </div>
            <p>Lütfen en kısa sürede kantine uğrayarak ödemenizi gerçekleştiriniz ve bakiyenizi güncelleyiniz.</p>
            <p>İyi çalışmalar dileriz.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">Bu e-posta otomatik bir hatırlatmadır, lütfen yanıtlamayınız.</p>
          </div>
        `
      };
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    res.status(200).json({ message: 'Hatırlatma mailleri başarıyla gönderildi.' });
  } catch (error) {
    console.error('Mail gönderim hatası:', error);
    res.status(500).json({ error: 'Mailler gönderilirken bir hata oluştu.', details: error.message });
  }
});

// SUNUCUYU BAŞLAT
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} portunda çalışıyor...`);
});
