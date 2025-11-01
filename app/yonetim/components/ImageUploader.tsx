'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploadComplete?: (url: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  onUploadComplete,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Value prop değiştiğinde preview'i güncelle
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`Dosya boyutu çok büyük. Maksimum ${Math.round(maxSize / 1024 / 1024)}MB olabilir.`);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
      setError('Desteklenmeyen dosya türü.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      console.log('Upload başlıyor...', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      console.log('FormData oluşturuldu, file count:', formData.getAll('file').length);

      // Admin token'ı al
      const token = sessionStorage.getItem('admin_token');
      
      // Upload file with auth
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response:', response.status);

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success && result.data) {
        let uploadedUrl = result.data.url;
        console.log('Upload başarılı:', uploadedUrl);
        
        // URL'yi olduğu gibi kullan (relative URL)
        setPreview(uploadedUrl);
        onChange(uploadedUrl);
        
        if (onUploadComplete) {
          onUploadComplete(uploadedUrl);
        }
      } else {
        console.error('Upload başarısız:', result);
        throw new Error(result.error || 'Yükleme başarısız');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Dosya yüklenirken hata oluştu.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Preview */}
        {preview && (
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-cover rounded-lg"
              style={{ minHeight: '200px' }}
              onError={(e) => {
                console.log('Preview image error:', preview);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${label.replace(/\s/g, '-')}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/\s/g, '-')}`}
            className={`
              flex items-center justify-center w-full px-4 py-3 
              border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
              cursor-pointer transition-all duration-200
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700'}
            `}
          >
            {uploading ? (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                <span>Yükleniyor...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <i className="ri-upload-cloud-line text-xl"></i>
                <span>{preview ? 'Farklı Resim Seç' : 'Resim Yükle'}</span>
              </div>
            )}
          </label>
        </div>

        {/* File info */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Desteklenen formatlar: JPG, PNG, WebP, GIF. Maksimum {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>
    </div>
  );
}
