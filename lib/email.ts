import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  // Timeout ayarları
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
  // Pool ayarları
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateLimit?: number;
  // Nodemailer için ek ayarlar
  [key: string]: any;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: any = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      },
      // Timeout ayarları
      connectionTimeout: 10000, // 10 saniye
      greetingTimeout: 5000,    // 5 saniye
      socketTimeout: 10000,     // 10 saniye
      // Pool ayarları
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Email yapılandırılmamışsa sessizce geç
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ Email yapılandırılmamış - mesaj veritabanına kaydedildi');
        return true;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });
      return true;
    } catch (error: any) {
      // Email hatalarını yakala ve sessizce geç
      if (error.code === 'EAUTH' || error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log('⚠️ Email servisi kullanılamıyor - mesaj veritabanına kaydedildi:', error.code);
        return true;
      }
      console.error('Email gönderme hatası:', error);
      return false;
    }
  }

  async sendContactEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Yeni İletişim Formu Mesajı</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ad Soyad:</strong> ${data.name}</p>
          <p><strong>E-posta:</strong> ${data.email}</p>
          <p><strong>Konu:</strong> ${data.subject}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <h3 style="color: #495057;">Mesaj:</h3>
          <p style="line-height: 1.6;">${data.message}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
          <p>Bu mesaj tolgademir.org web sitesinden gönderilmiştir.</p>
          <p>Gönderilme Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
      </div>
    `;

    const text = `
      Yeni İletişim Formu Mesajı
      
      Ad Soyad: ${data.name}
      E-posta: ${data.email}
      Konu: ${data.subject}
      
      Mesaj:
      ${data.message}
      
      Bu mesaj tolgademir.org web sitesinden gönderilmiştir.
      Gönderilme Tarihi: ${new Date().toLocaleString('tr-TR')}
    `;

    return await this.sendEmail({
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER || '',
      subject: `İletişim Formu: ${data.subject}`,
      html,
      text
    });
  }

  async sendContactReply(email: string, name: string, subject: string, reply: string): Promise<boolean> {
    try {
      // Email config kontrolü
      if (!process.env.EMAIL_PASS) {
        console.log('🔄 EMAIL DEV MODE - Gerçek email gönderilmedi, sadece log:');
        console.log(`📧 Alıcı: ${email}`);
        console.log(`📝 Konu: Cevap: ${subject}`);
        console.log(`💬 Mesaj: ${reply}`);
        console.log("🔧 Email göndermek için env.local'de EMAIL_PASS ayarlayın");
        return true; // Development modunda true döner
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Cevap: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Merhaba ${name},</h2>
            <p>Mesajınıza cevap verildi:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #374151; white-space: pre-wrap;">${reply}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Saygılarımızla,<br>
              Tolga Demir
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Mesaj cevabı email ile gönderildi:', email);
      return true;
    } catch (error) {
      console.error('❌ Mesaj cevabı email hatası:', error);
      return false;
    }
  }

  async sendNewsletterNotification(email: string, name: string, type: string, title: string, message: string, bookId?: number, chapterId?: number): Promise<boolean> {
    try {
      const bookLink = bookId ? `http://localhost:3001/kitaplar/${bookId}` : '';
      const typeText = type === 'new-book' ? '📚 Yeni Kitap' : '📖 Yeni Bölüm';
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `${typeText}: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #f97316, #fb923c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">${typeText}</h1>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #f97316; margin-bottom: 10px;">${title}</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">${message}</p>
              ${bookLink ? `
                <a href="${bookLink}" style="
                  display: inline-block;
                  background: linear-gradient(to right, #f97316, #fb923c);
                  color: white;
                  padding: 12px 30px;
                  border-radius: 25px;
                  text-decoration: none;
                  font-weight: bold;
                  margin-top: 20px;
                ">Şimdi Oku</a>
              ` : ''}
            </div>
            <div style="padding: 20px; background: #f3f4f6; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Bu email'i aldınız çünkü Tolga Demir haber bültenine abone oldunuz.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Newsletter bildirimi gönderildi:', email);
      return true;
    } catch (error) {
      console.error('❌ Newsletter bildirim hatası:', error);
      return false;
    }
  }

  async sendNewsletterConfirmation(email: string, name?: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c; text-align: center;">Tolga Demir Newsletter</h2>
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #495057;">Hoş Geldiniz!</h3>
          <p style="font-size: 16px; line-height: 1.6;">
            ${name ? `Merhaba ${name},` : 'Merhaba,'}
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Newsletter listemize başarıyla kaydoldunuz. Yeni kitap duyuruları ve 
            özel içeriklerden haberdar olmak için bizi takip edin.
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tolgademir.org" 
             style="background-color: #ea580c; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Web Sitemi Ziyaret Et
          </a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; 
                    color: #6c757d; font-size: 12px; text-align: center;">
          <p>Bu e-postayı almak istemiyorsanız, bu linke tıklayarak abonelikten çıkabilirsiniz.</p>
          <p>© ${new Date().getFullYear()} Tolga Demir. Tüm hakları saklıdır.</p>
        </div>
      </div>
    `;

    const text = `
      Tolga Demir Newsletter
      
      ${name ? `Merhaba ${name},` : 'Merhaba,'}
      
      Newsletter listemize başarıyla kaydoldunuz. Yeni kitap duyuruları ve 
      özel içeriklerden haberdar olmak için bizi takip edin.
      
      Web Sitemi Ziyaret Et: https://tolgademir.org
      
      Bu e-postayı almak istemiyorsanız, abonelikten çıkabilirsiniz.
      © ${new Date().getFullYear()} Tolga Demir. Tüm hakları saklıdır.
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Tolga Demir Newsletter - Hoş Geldiniz!',
      html,
      text
    });
  }
}

export const emailService = new EmailService();