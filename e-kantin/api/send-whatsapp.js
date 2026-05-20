export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri desteklenir.' });
  }

  const { borclular } = req.body;

  // WhatsApp gönderimi için bir API (Twilio, UltraMsg vb.) gerekir.
  // Şimdilik sadece simüle ediyoruz.
  console.log('WhatsApp gönderimi simüle ediliyor:', borclular);

  return res.status(200).json({ message: 'WhatsApp mesajları sıraya alındı (Simüle edildi).' });
}
