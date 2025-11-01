
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  event_type: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  max_participants: number;
  current_participants: number;
  has_capacity_limit: boolean;
  image_url: string;
  registration_required: boolean;
  registration_deadline: string;
  created_at: string;
  updated_at: string;
}

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    eventType: 'workshop',
    hasCapacityLimit: false,
    maxParticipants: 0,
    currentParticipants: 0,
    imageUrl: '',
    registrationRequired: true,
    registrationDeadline: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING EVENTS ===');
      
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      console.log('Events API Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Events API Response:', result);
        
        if (result.success && result.data) {
          setEvents(result.data);
          console.log('✅ Events loaded successfully:', result.data.length, 'events');
        } else {
          console.error('API returned invalid data structure:', result);
          setEvents([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Events API error:', response.status, errorText);
        setEvents([]);
      }
    } catch (error) {
      console.error('=== LOAD EVENTS ERROR ===');
      console.error('Error details:', error);
      setEvents([]);
    } finally {
      console.log('=== LOADING COMPLETE ===');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showMessage('Etkinlik başlığı gereklidir!', 'error');
      return;
    }

    if (!formData.date) {
      showMessage('Etkinlik tarihi gereklidir!', 'error');
      return;
    }

    if (!formData.time) {
      showMessage('Etkinlik saati gereklidir!', 'error');
      return;
    }

    if (formData.hasCapacityLimit && formData.maxParticipants <= 0) {
      showMessage('Kapasite sınırı varsa maksimum katılımcı sayısı 0\'dan büyük olmalıdır!', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // API için veri hazırla
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        event_type: formData.eventType,
        has_capacity_limit: formData.hasCapacityLimit,
        max_participants: formData.hasCapacityLimit ? formData.maxParticipants : 0,
        current_participants: formData.currentParticipants,
        image_url: formData.imageUrl,
        registration_required: formData.registrationRequired,
        registration_deadline: formData.registrationDeadline
      };

      console.log('=== SAVING EVENT ===');
      console.log('Event Data:', eventData);

      if (editingEvent) {
        console.log('Updating existing event:', editingEvent.id);
        
        const response = await fetch(`/api/books`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(eventData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Event update error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Event update response:', result);

        if (!result.success) {
          throw new Error(result.error || 'Event update error');
        }

        console.log('Event updated successfully!');
        showMessage('Etkinlik başarıyla güncellendi!', 'success');
      } else {
        console.log('Adding new event');

        const response = await fetch(`/api/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(eventData)
        });

        console.log('API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response Error:', response.status, errorText);
          throw new Error(`Etkinlik eklenirken hata oluştu: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('=== EVENT CREATE RESPONSE ===');
        console.log('API Response:', result);

        if (!result.success) {
          console.error('API returned success: false');
          console.error('Error details:', result.error);
          console.error('Full response:', result);
          throw new Error(result.error || 'Etkinlik ekleme hatası');
        }

        console.log('✅ Event added successfully!', result.data);
        showMessage(`Etkinlik "${result.data.title}" başarıyla eklendi!`, 'success');
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        eventType: 'workshop',
        hasCapacityLimit: false,
        maxParticipants: 0,
        currentParticipants: 0,
        imageUrl: '',
        registrationRequired: true,
        registrationDeadline: ''
      });
      
      console.log('🔄 Reloading events data...');
      setTimeout(async () => {
        await loadEvents();
      }, 500);

    } catch (error) {
      console.error('=== EVENT SAVE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      showMessage('Etkinlik kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      eventType: event.event_type || 'workshop',
      hasCapacityLimit: event.has_capacity_limit || false,
      maxParticipants: event.max_participants || 0,
      currentParticipants: event.current_participants || 0,
      imageUrl: event.image_url || '',
      registrationRequired: event.registration_required !== false,
      registrationDeadline: event.registration_deadline || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;

    try {
      console.log('Deleting event:', id);
      
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', response.status, errorText);
        throw new Error(`Silme hatası: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete response:', result);

      if (result.success) {
        console.log('✅ Event deleted successfully!');
        showMessage('Etkinlik başarıyla silindi!', 'success');
        
        setTimeout(async () => {
          await loadEvents();
        }, 500);
      } else {
        throw new Error(result.error || 'Etkinlik silme hatası');
      }
    } catch (error) {
      console.error('Event delete error:', error);
      showMessage('Etkinlik silinirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  };

  const generateImageUrl = (prompt: string) => {
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\\s]/g, '').substring(0, 100);
    return `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28cleanPrompt%20%20%20%20event%20workshop%20seminar%20Turkish%20modern%20professional%29%7D&width=400&height=250&seq=event${Date.now()}&orientation=landscape`;
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate > now) return 'upcoming';
    if (eventDate.toDateString() === now.toDateString()) return 'ongoing';
    return 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-700';
      case 'ongoing': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 dark:bg-gray-800 text-gray-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Yaklaşan';
      case 'ongoing': return 'Devam Eden';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const getParticipationRate = (event: Event) => {
    if (!event.has_capacity_limit || event.max_participants === 0) return 0;
    return Math.round((event.current_participants / event.max_participants) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'error' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Etkinlik Yönetimi</h2>
          <p className="text-gray-600">Etkinliklerinizi oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Yeni Etkinlik Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Etkinlik</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{events.length}</p>
            </div>
            <i className="ri-calendar-event-line text-2xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Yaklaşan</p>
              <p className="text-2xl font-bold text-blue-600">
                {events.filter(event => getEventStatus(event) === 'upcoming').length}
              </p>
            </div>
            <i className="ri-calendar-check-line text-2xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Katılımcı</p>
              <p className="text-2xl font-bold text-green-600">
                {events.reduce((total, event) => total + (event.current_participants || 0), 0)}
              </p>
            </div>
            <i className="ri-group-line text-2xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-600">
                {events.filter(event => getEventStatus(event) === 'completed').length}
              </p>
            </div>
            <i className="ri-check-circle-line text-2xl text-gray-500"></i>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Etkinlik Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Etkinlik başlığını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Etkinlik açıklaması"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Saat *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Etkinlik konumu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Etkinlik Türü
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
                >
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminer</option>
                  <option value="conference">Konferans</option>
                  <option value="book_signing">İmza Günü</option>
                  <option value="reading">Okuma Etkinliği</option>
                  <option value="discussion">Söyleşi</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              {/* Kapasite Ayarları */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasCapacityLimit"
                    checked={formData.hasCapacityLimit}
                    onChange={(e) => setFormData({ ...formData, hasCapacityLimit: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="hasCapacityLimit" className="text-sm font-medium text-gray-700">
                    Katılımcı sayısında sınır var
                  </label>
                </div>

                {formData.hasCapacityLimit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Maksimum Katılımcı Sayısı *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required={formData.hasCapacityLimit}
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Maksimum katılımcı sayısı"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Mevcut Katılımcı Sayısı
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.hasCapacityLimit ? formData.maxParticipants : undefined}
                    value={formData.currentParticipants}
                    onChange={(e) => setFormData({ ...formData, currentParticipants: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Şu anda kayıtlı katılımcı sayısı"
                  />
                </div>

                {formData.hasCapacityLimit && formData.maxParticipants > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Katılımcı Oranı</span>
                      <span className="text-sm font-medium">
                        {Math.round((formData.currentParticipants / formData.maxParticipants) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min((formData.currentParticipants / formData.maxParticipants) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <ImageUploader
                label="Etkinlik Görseli"
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registrationRequired"
                    checked={formData.registrationRequired}
                    onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="registrationRequired" className="text-sm font-medium text-gray-700">
                    Kayıt gerekli
                  </label>
                </div>

                {formData.registrationRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Kayıt Son Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      {editingEvent ? 'Güncelle' : 'Kaydet'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 gap-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-calendar-event-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz etkinlik eklenmemiş</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              İlk Etkinliğinizi Ekleyin
            </button>
          </div>
        ) : (
          events.map((event) => {
            const status = getEventStatus(event);
            const participationRate = getParticipationRate(event);
            
            return (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-24 h-32 object-cover object-top rounded-lg flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{event.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-3">{event.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span>
                              <i className="ri-calendar-line mr-1"></i>
                              {new Date(event.date).toLocaleDateString('tr-TR')}
                            </span>
                            <span>
                              <i className="ri-time-line mr-1"></i>
                              {event.time}
                            </span>
                            {event.location && (
                              <span>
                                <i className="ri-map-pin-line mr-1"></i>
                                {event.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                              {event.event_type === 'workshop' ? 'Workshop' :
                               event.event_type === 'seminar' ? 'Seminer' :
                               event.event_type === 'conference' ? 'Konferans' :
                               event.event_type === 'book_signing' ? 'İmza Günü' :
                               event.event_type === 'reading' ? 'Okuma Etkinliği' :
                               event.event_type === 'discussion' ? 'Söyleşi' :
                               'Diğer'}
                            </span>
                            
                            <span className="text-gray-600">
                              <i className="ri-group-line mr-1"></i>
                              {event.has_capacity_limit 
                                ? `${event.current_participants}/${event.max_participants} kişi` 
                                : `${event.current_participants} katılımcı`}
                            </span>

                            {event.has_capacity_limit && participationRate > 0 && (
                              <span className={`text-xs ${participationRate >= 90 ? 'text-red-600' : participationRate >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                                %{participationRate} dolu
                              </span>
                            )}
                          </div>

                          {event.has_capacity_limit && event.max_participants > 0 && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    participationRate >= 90 ? 'bg-red-500' :
                                    participationRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(participationRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-edit-line mr-1"></i>
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
