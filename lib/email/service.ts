import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(config);
  }

  // Email gönder
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: emailData.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        replyTo: emailData.replyTo
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // İletişim formu email'i gönder
  async sendContactEmail(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Yeni İletişim Mesajı</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Gönderen:</strong> ${formData.name}</p>
          <p><strong>E-posta:</strong> ${formData.email}</p>
          <p><strong>Konu:</strong> ${formData.subject}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #374151; margin-top: 0;">Mesaj:</h3>
          <p style="line-height: 1.6; color: #4b5563;">${formData.message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Not:</strong> Bu mesaj tolgademir.org web sitesindeki iletişim formu aracılığıyla gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    const text = `
Yeni İletişim Mesajı

Gönderen: ${formData.name}
E-posta: ${formData.email}
Konu: ${formData.subject}

Mesaj:
${formData.message}

Bu mesaj tolgademir.org web sitesindeki iletişim formu aracılığıyla gönderilmiştir.
    `;

    return await this.sendEmail({
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `İletişim Formu: ${formData.subject}`,
      html,
      text,
      replyTo: formData.email
    });
  }

  // Newsletter kayıt onay email'i
  async sendNewsletterConfirmation(email: string, unsubscribeToken: string): Promise<boolean> {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; margin: 0;">Tolga Demir</h1>
          <p style="color: #6b7280; margin: 5px 0;">Yazar & Hikaye Anlatıcı</p>
        </div>
        
        <h2 style="color: #374151;">Newsletter Kaydınız Başarılı!</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">
          Merhaba,<br><br>
          Newsletter listemize başarıyla kaydoldunuz. Artık yeni kitap duyuruları, 
          blog yazıları ve özel içeriklerden haberdar olacaksınız.
        </p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">Ne bekleyebilirsiniz?</h3>
          <ul style="color: #92400e;">
            <li>Yeni kitap duyuruları</li>
            <li>Blog yazıları ve makaleler</li>
            <li>Etkinlik duyuruları</li>
            <li>Özel içerikler ve güncellemeler</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" 
             style="background: #ea580c; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Web Sitemi Ziyaret Et
          </a>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
            Bu emaili artık almak istemiyorsanız 
            <a href="${unsubscribeUrl}" style="color: #ea580c;">buradan</a> 
            aboneliğinizi iptal edebilirsiniz.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Newsletter Kaydınız Başarılı - Tolga Demir',
      html
    });
  }

  // Admin bildirim email'i
  async sendAdminNotification(subject: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColors[priority]}; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Admin Bildirimi</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Öncelik: ${priority.toUpperCase()}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h3 style="color: #374151; margin-top: 0;">${subject}</h3>
          <p style="color: #4b5563; line-height: 1.6;">${message}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Bu bildirim tolgademir.org admin paneli tarafından gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `[Admin] ${subject}`,
      html
    });
  }

  // Email bağlantısını test et
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
