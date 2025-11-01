
'use client';

import { useState } from 'react';
import Footer from '../../components/Footer';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validasyonu
    if (formData.message.length > 500) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // İletişim mesajını gönder
      const response = await fetch(`/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          priority: 'normal'
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        console.log('Message sent successfully:', result.data);
      } else {
        throw new Error(result.error || 'Form gönderilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);

      // Durum mesajını 3 saniye sonra gizle
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4">İletişim</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Benimle iletişime geçip merak ettiğiniz her şey hakkında bilgi almak için.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Bana Ulaşın</h2>

                <form 
                  id="contact-form" 
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                  data-readdy-form="true"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Adınızı ve soyadınızı yazın"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      E-posta *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="E-posta adresinizi yazın"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Konu *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">Bir konu seçin</option>
                      <option value="Genel Sorular">Genel Sorular</option>
                      <option value="Hikaye Önerileri">Hikaye Önerileri</option>
                      <option value="İş Birliği">İş Birliği</option>
                      <option value="Teknik Destek">Teknik Destek</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Mesaj *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      maxLength={500}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none text-sm"
                      placeholder="Mesajınızı buraya yazın..."
                    />
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formData.message.length}/500 karakter
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || formData.message.length > 500}
                    className="w-full bg-orange-600 text-white py-4 rounded-full font-semibold hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                  </button>
                </form>

                {submitStatus === 'success' && (
                  <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center">
                    Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağım.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-center">
                    Mesaj gönderilirken bir hata oluştu. Lütfen tüm alanları doğru doldurup tekrar deneyin.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Sosyal Medya</h3>
                <p className="text-gray-600 mb-6">
                  Günlük paylaşımlarım ve hikaye güncellemelerim için sosyal medya hesaplarımı
                  takip edebilirsiniz
                </p>

                <div className="space-y-4">
                  <a
                    href="https://www.instagram.com/tolgademir1914"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full">
                      <i className="ri-instagram-line text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Instagram</h4>
                      <p className="text-sm text-gray-600">@tolgademir1914</p>
                    </div>
                  </a>

                  <a
                    href="https://open.spotify.com/user/31cxmviybemcerfgxks6cy72xlva?si=9ROLFhJ2Rk2AY3AKwW7hgw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                      <i className="ri-spotify-line text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Spotify</h4>
                      <p className="text-sm text-gray-600">Tolga Demir</p>
                    </div>
                  </a>

                  <a
                    href="https://whatsapp.com/channel/0029VaMQf66GpLHORoiwht2b"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                      <i className="ri-whatsapp-line text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">WhatsApp Kanalı</h4>
                      <p className="text-sm text-gray-600">Tolga Demir</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src="https://readdy.ai/api/search-image?query=Elegant%20workspace%20of%20a%20female%20author%2C%20beautiful%20writing%20desk%20with%20vintage%20books%2C%20fresh%20flowers%20in%20soft%20pastel%20colors%2C%20inspiring%20and%20cozy%20atmosphere%2C%20warm%20natural%20lighting%2C%20sophisticated%20interior%20design%20with%20literary%20elements&width=600&height=400&seq=contact-image&orientation=landscape"
                  alt="Çalışma Alanım"
                  className="w-full h-48 object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
