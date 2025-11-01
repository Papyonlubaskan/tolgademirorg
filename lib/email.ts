import nodemailer from 'nodemailer';

// E-posta yapılandırması
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'okandemir.org',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'tolgademir@okandemir.org',
    pass: process.env.EMAIL_PASS || 'Okan-1234-5678',
  },
});

// E-posta gönderme fonksiyonu
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}) {
  try {
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'tolgademir@okandemir.org',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      replyTo: replyTo || process.env.REPLY_TO_EMAIL || 'tolgademir@okandemir.org',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error };
  }
}

// Toplu e-posta gönderme (abonelere)
export async function sendBulkEmail({
  subscribers,
  subject,
  html,
  text,
}: {
  subscribers: string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  const results = [];
  
  // Batch olarak gönder (her seferinde 50 kişi)
  const batchSize = 50;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    try {
      const result = await sendEmail({
        to: batch,
        subject,
        html,
        text,
      });
      results.push({ batch: i / batchSize + 1, ...result });
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error);
      results.push({ batch: i / batchSize + 1, success: false, error });
    }
  }
  
  return results;
}

// İletişim formu yanıt şablonu
export function getContactReplyTemplate({
  userName,
  userMessage,
  replyMessage,
}: {
  userName: string;
  userMessage: string;
  replyMessage: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .original-message { background: #e5e7eb; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-style: italic; font-family: 'Times New Roman', serif;">Tolga Demir</h1>
      <p style="margin: 10px 0 0 0;">Yazar & Hikaye Anlatıcı</p>
    </div>
    <div class="content">
      <h2>Merhaba ${userName},</h2>
      
      <p>${replyMessage}</p>
      
      <div class="original-message">
        <p style="margin: 0 0 10px 0;"><strong>Gönderdiğiniz Mesaj:</strong></p>
        <p style="margin: 0;">${userMessage}</p>
      </div>
      
      <p>Saygılarımla,<br><strong>Tolga Demir</strong></p>
      
      <div class="footer">
        <p>Bu e-posta tolgademir.org'dan gönderilmiştir.</p>
        <p>© 2025 Tolga Demir - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Yeni kitap/güncelleme bildirimi şablonu
export function getUpdateNotificationTemplate({
  title,
  description,
  bookTitle,
  bookCoverUrl,
  bookUrl,
}: {
  title: string;
  description: string;
  bookTitle?: string;
  bookCoverUrl?: string;
  bookUrl?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .book-card { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .book-cover { max-width: 200px; border-radius: 10px; margin-bottom: 15px; }
    .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-style: italic; font-family: 'Times New Roman', serif;">Tolga Demir</h1>
      <p style="margin: 10px 0 0 0;">${title}</p>
    </div>
    <div class="content">
      <p>${description}</p>
      
      ${
        bookTitle
          ? `
      <div class="book-card">
        ${bookCoverUrl ? `<img src="${bookCoverUrl}" alt="${bookTitle}" class="book-cover" />` : ''}
        <h2 style="margin: 10px 0;">${bookTitle}</h2>
        ${bookUrl ? `<a href="${bookUrl}" class="cta-button">Hemen Oku</a>` : ''}
      </div>
      `
          : ''
      }
      
      <p>Saygılarımla,<br><strong>Tolga Demir</strong></p>
      
      <div class="footer">
        <p>Bu e-posta tolgademir.org aboneliğiniz nedeniyle gönderilmiştir.</p>
        <p><a href="https://tolgademir.org/newsletter/unsubscribe" style="color: #f97316;">Abonelikten çık</a></p>
        <p>© 2025 Tolga Demir - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Test e-postası gönder
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'Test E-postası - Tolga Demir',
    html: `
      <h1>E-posta Sistemi Başarıyla Kuruldu!</h1>
      <p>Bu bir test e-postasıdır. E-posta sisteminiz çalışıyor.</p>
      <p>Saygılarımla,<br>Tolga Demir</p>
    `,
  });
}
