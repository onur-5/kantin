import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS Headers for serverless responses (useful for potential cross-origin requests)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri desteklenir.' });
  }

  const { borclular } = req.body;

  if (!borclular || !Array.isArray(borclular)) {
    return res.status(400).json({ error: 'Geçersiz veri formatı. "borclular" dizisi gereklidir.' });
  }

  const emailUser = process.env.EMAIL_USER || 'onurseyfeddin83@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'nafd cicl dwwq cghr';

  // Nodemailer Transporter Konfigürasyonu
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  try {
    // Tüm borçlulara paralel olarak mail gönderim işlemleri başlatılır
    const emailPromises = borclular.map(member => {
      const mailOptions = {
        from: `"Kantin Otomasyon" <${emailUser}>`,
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
    return res.status(200).json({ message: 'Hatırlatma mailleri başarıyla gönderildi.' });
  } catch (error) {
    console.error('Mail gönderim hatası:', error);
    return res.status(500).json({ 
      error: 'Mailler gönderilirken bir hata oluştu.', 
      details: error.message 
    });
  }
}
