'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSlug } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
}

export default function SearchBar({ 
  placeholder = "Kitaplarda ara...", 
  className = "",
  showFilters = false 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Sıralama seçenekleri
  const sortOptions = [
    { value: 'created_at', label: 'En Yeni' },
    { value: 'title', label: 'Başlık' },
    { value: 'views', label: 'En Çok Okunan' },
    { value: 'likes', label: 'En Beğenilen' }
  ];

  // Arama fonksiyonu
  const searchBooks = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10',
        category,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/books/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchBooks(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, category, sortBy, sortOrder]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchParams = new URLSearchParams({
        q: query,
        ...(category && { category }),
        ...(sortBy !== 'created_at' && { sortBy }),
        ...(sortOrder !== 'desc' && { sortOrder })
      });
      router.push(`/kitaplar?${searchParams.toString()}`);
      setIsOpen(false);
    }
  };

  // Handle result click
  const handleResultClick = (book: any) => {
    router.push(`/kitaplar/${createSlug(book.title)}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="ri-search-line text-xl"></i>
          </div>
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300">Aranıyor...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleResultClick(book)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-12 h-16 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <i className="ri-book-line text-orange-500 text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {book.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                        <span>{book.author}</span>
                        <span>{book.chapters_count} bölüm</span>
                        {book.views > 0 && <span>{book.views} görüntüleme</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-2">
                <button
                  onClick={handleSearch}
                  className="w-full text-center text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Tüm sonuçları görüntüle
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <i className="ri-search-line text-2xl mb-2"></i>
              <p>Sonuç bulunamadı</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
