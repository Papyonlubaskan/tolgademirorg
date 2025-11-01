'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BookFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  category: string;
  status: string;
  sortBy: string;
  sortOrder: string;
  dateRange: string;
}

export default function BookFilters({ onFiltersChange }: BookFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || 'published',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    dateRange: searchParams.get('dateRange') || ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Kategoriler
  const categories = [
    { value: '', label: 'Tüm Kategoriler' },
    { value: 'roman', label: 'Roman' },
    { value: 'hikaye', label: 'Hikaye' },
    { value: 'deneme', label: 'Deneme' },
    { value: 'siir', label: 'Şiir' },
    { value: 'biyografi', label: 'Biyografi' },
    { value: 'otobiyografi', label: 'Otobiyografi' }
  ];

  // Durumlar
  const statuses = [
    { value: 'published', label: 'Yayınlanmış' },
    { value: 'draft', label: 'Taslak' },
    { value: 'archived', label: 'Arşivlenmiş' }
  ];

  // Sıralama seçenekleri
  const sortOptions = [
    { value: 'created_at', label: 'En Yeni' },
    { value: 'title', label: 'Başlık' },
    { value: 'views', label: 'En Çok Okunan' },
    { value: 'likes_count', label: 'En Beğenilen' },
    { value: 'chapters_count', label: 'En Çok Bölüm' }
  ];

  // Tarih aralıkları
  const dateRanges = [
    { value: '', label: 'Tüm Zamanlar' },
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'year', label: 'Bu Yıl' },
    { value: 'last-year', label: 'Geçen Yıl' }
  ];

  // Filtreleri güncelle
  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // URL'i güncelle
  const updateURL = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.push(`/kitaplar${newURL}`, { scroll: false });
  };

  // Filtreleri sıfırla
  const resetFilters = () => {
    const defaultFilters: FilterState = {
      category: '',
      status: 'published',
      sortBy: 'created_at',
      sortOrder: 'desc',
      dateRange: ''
    };
    
    setFilters(defaultFilters);
    
    if (onFiltersChange) {
      onFiltersChange(defaultFilters);
    }
    
    router.push('/kitaplar', { scroll: false });
  };

  // URL değişikliklerini dinle
  useEffect(() => {
    const newFilters: FilterState = {
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || 'published',
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      dateRange: searchParams.get('dateRange') || ''
    };
    
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [searchParams]); // onFiltersChange dependency kaldırıldı

  // URL'i güncelle (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  // Aktif filtre sayısını hesapla
  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== '' && value !== 'published' && value !== 'created_at' && value !== 'desc'
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <i className="ri-filter-line text-orange-500"></i>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Filtreler
          </h3>
          {activeFiltersCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
            >
              Temizle
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
          >
            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line`}></i>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sıralama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sıralama
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sıralama Yönü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yön
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>

        {/* Tarih Aralığı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarih Aralığı
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Hızlı Filtreler:</span>
          <button
            onClick={() => updateFilter('status', 'published')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.status === 'published'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
          >
            Yayınlanmış
          </button>
          <button
            onClick={() => updateFilter('sortBy', 'views')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.sortBy === 'views'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
          >
            Popüler
          </button>
          <button
            onClick={() => updateFilter('sortBy', 'created_at')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.sortBy === 'created_at'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
            }`}
          >
            En Yeni
          </button>
        </div>
      </div>
    </div>
  );
}
