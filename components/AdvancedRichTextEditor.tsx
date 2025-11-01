'use client';

import { useEffect, useRef, useState } from 'react';

interface AdvancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
  className?: string;
  enableImageUpload?: boolean;
}

export default function AdvancedRichTextEditor({
  value,
  onChange,
  placeholder = 'İçeriğinizi buraya yazın...',
  height = '400px',
  disabled = false,
  className = '',
  enableImageUpload = true
}: AdvancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            executeCommand('redo');
          } else {
            executeCommand('undo');
          }
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
      }
    }

    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        executeCommand('outdent');
      } else {
        executeCommand('indent');
      }
    }

    // Handle enter key for better paragraph handling
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if we're in a list
        const listItem = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement?.closest('li')
          : (container as Element).closest('li');
          
        if (listItem) {
          // Let browser handle list items naturally
          return;
        }
      }
      
      // For paragraphs, insert proper line breaks
      e.preventDefault();
      executeCommand('insertHTML', '<br><br>');
    }
  };

  const insertLink = () => {
    const url = prompt('Link URL\'sini girin:');
    if (url) {
      const text = selectedText || prompt('Link metni:') || url;
      executeCommand('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!enableImageUpload) return;

    try {
      setUploading(true);
      
      const token = sessionStorage.getItem('admin_token');
      if (!token) {
        alert('Oturum süresi dolmuş');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        executeCommand('insertImage', result.data.url);
      } else {
        alert(result.error || 'Resim yüklenemedi');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Sadece resim dosyaları yüklenebilir');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan büyük olamaz');
        return;
      }

      handleImageUpload(file);
      e.target.value = ''; // Reset input
    }
  };

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      executeCommand('insertImage', imageUrl);
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const insertTable = () => {
    const rows = prompt('Satır sayısı:', '3');
    const cols = prompt('Sütun sayısı:', '3');
    
    if (rows && cols) {
      const rowCount = parseInt(rows);
      const colCount = parseInt(cols);
      
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      
      for (let i = 0; i < rowCount; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < colCount; j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      
      tableHTML += '</table>';
      executeCommand('insertHTML', tableHTML);
    }
  };

  const insertCode = () => {
    const code = prompt('Kod bloğu:');
    if (code) {
      executeCommand('insertHTML', `<pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>${code}</code></pre>`);
    }
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const insertList = (ordered: boolean) => {
    executeCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const changeTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const changeBackgroundColor = (color: string) => {
    executeCommand('hiliteColor', color);
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const toolbarSections = [
    // Text formatting
    [
      { icon: 'ri-bold', command: 'bold', tooltip: 'Kalın (Ctrl+B)' },
      { icon: 'ri-italic', command: 'italic', tooltip: 'İtalik (Ctrl+I)' },
      { icon: 'ri-underline', command: 'underline', tooltip: 'Altı çizili (Ctrl+U)' },
      { icon: 'ri-strikethrough', command: 'strikeThrough', tooltip: 'Üstü çizili' },
      { icon: 'ri-subscript', command: 'subscript', tooltip: 'Alt simge' },
      { icon: 'ri-superscript', command: 'superscript', tooltip: 'Üst simge' },
    ],
    
    // Text alignment
    [
      { icon: 'ri-align-left', command: 'justifyLeft', tooltip: 'Sola hizala' },
      { icon: 'ri-align-center', command: 'justifyCenter', tooltip: 'Ortala' },
      { icon: 'ri-align-right', command: 'justifyRight', tooltip: 'Sağa hizala' },
      { icon: 'ri-align-justify', command: 'justifyFull', tooltip: 'İki yana yasla' },
    ],
    
    // Lists and indentation
    [
      { icon: 'ri-list-unordered', action: () => insertList(false), tooltip: 'Madde işaretli liste' },
      { icon: 'ri-list-ordered', action: () => insertList(true), tooltip: 'Numaralı liste' },
      { icon: 'ri-indent-increase', command: 'indent', tooltip: 'Girintiyi artır' },
      { icon: 'ri-indent-decrease', command: 'outdent', tooltip: 'Girintiyi azalt' },
    ],
    
    // Links and media
    [
      { icon: 'ri-link', action: insertLink, tooltip: 'Link ekle (Ctrl+K)' },
      { icon: 'ri-image-line', action: () => enableImageUpload ? fileInputRef.current?.click() : setShowImageModal(true), tooltip: 'Resim ekle' },
      { icon: 'ri-table-line', action: insertTable, tooltip: 'Tablo ekle' },
      { icon: 'ri-code-box-line', action: insertCode, tooltip: 'Kod bloğu ekle' },
    ],
    
    // Undo/Redo
    [
      { icon: 'ri-arrow-go-back-line', command: 'undo', tooltip: 'Geri al (Ctrl+Z)' },
      { icon: 'ri-arrow-go-forward-line', command: 'redo', tooltip: 'Yinele (Ctrl+Shift+Z)' },
    ],
  ];

  const getWordCount = () => {
    return value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    return value.replace(/<[^>]*>/g, '').length;
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const words = getWordCount();
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${className} ${disabled ? 'opacity-50' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-300 dark:border-gray-600 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {/* Format Dropdown */}
          <select
            onChange={(e) => formatBlock(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-2"
            disabled={disabled}
          >
            <option value="div">Normal</option>
            <option value="h1">Başlık 1</option>
            <option value="h2">Başlık 2</option>
            <option value="h3">Başlık 3</option>
            <option value="h4">Başlık 4</option>
            <option value="h5">Başlık 5</option>
            <option value="h6">Başlık 6</option>
            <option value="p">Paragraf</option>
            <option value="blockquote">Alıntı</option>
            <option value="pre">Kod Bloku</option>
          </select>

          {/* Font Size */}
          <select
            onChange={(e) => executeCommand('fontSize', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-2"
            disabled={disabled}
          >
            <option value="1">8pt</option>
            <option value="2">10pt</option>
            <option value="3">12pt</option>
            <option value="4">14pt</option>
            <option value="5">18pt</option>
            <option value="6">24pt</option>
            <option value="7">36pt</option>
          </select>

          {/* Toolbar Sections */}
          {toolbarSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex items-center">
              {section.map((button, buttonIndex) => (
                <button
                  key={buttonIndex}
                  type="button"
                  onClick={() => {
                    if (button.action) {
                      button.action();
                    } else if (button.command) {
                      executeCommand(button.command);
                    }
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  title={button.tooltip}
                  disabled={disabled}
                >
                  <i className={`${button.icon} text-sm`}></i>
                </button>
              ))}
              
              {sectionIndex < toolbarSections.length - 1 && (
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              )}
            </div>
          ))}

          {/* Color Controls */}
          <div className="flex items-center ml-2">
            <div className="relative group">
              <button
                type="button"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Metin rengi"
                disabled={disabled}
              >
                <i className="ri-font-color text-sm"></i>
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2 hidden group-hover:block z-10">
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000', '#333333', '#666666', '#999999',
                    '#CCCCCC', '#FFFFFF', '#FF0000', '#00FF00',
                    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                    '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => changeTextColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Arka plan rengi"
                disabled={disabled}
              >
                <i className="ri-mark-pen-line text-sm"></i>
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg p-2 hidden group-hover:block z-10">
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#FFFFFF', '#FFFF00', '#00FF00', '#00FFFF',
                    '#FF00FF', '#FFA500', '#FFC0CB', '#FFE4E1',
                    '#E6E6FA', '#F0F8FF', '#F5F5DC', '#FFF8DC',
                    '#FFFACD', '#F0FFF0', '#F0FFFF', '#FFE4B5'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => changeBackgroundColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          className={`p-4 min-h-0 focus:outline-none text-gray-900 dark:text-white leading-relaxed prose prose-orange max-w-none ${
            isFocused ? 'ring-2 ring-orange-500 ring-inset' : ''
          }`}
          style={{ minHeight: height }}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
        
        {/* Placeholder */}
        {!value && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              <span className="text-orange-600 dark:text-orange-400">Resim yükleniyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-300 dark:border-gray-600 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Kelime: {getWordCount()}</span>
          <span>Karakter: {getCharCount()}</span>
          <span>Okuma süresi: ~{getReadingTime()} dk</span>
        </div>
        
        {selectedText && (
          <div>
            Seçili: {selectedText.length} karakter
          </div>
        )}
      </div>

      {/* Hidden file input for image upload */}
      {enableImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      )}

      {/* Image URL Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resim Ekle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resim URL'si
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setImageUrl('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={insertImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
