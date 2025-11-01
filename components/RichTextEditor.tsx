'use client';

import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
  className?: string;
}

interface EditorCommand {
  command: string;
  value?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'İçeriğinizi buraya yazın...',
  height = '300px',
  disabled = false,
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState('');

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
      }
    }

    // Handle enter key for paragraphs
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand('insertHTML', '<br><br>');
    }
  };

  const insertLink = () => {
    const url = prompt('Link URL\'sini girin:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Resim URL\'sini girin:');
    if (url) {
      executeCommand('insertImage', url);
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

  const toolbarButtons = [
    // Text formatting
    { icon: 'ri-bold', command: 'bold', tooltip: 'Kalın (Ctrl+B)', shortcut: 'Ctrl+B' },
    { icon: 'ri-italic', command: 'italic', tooltip: 'İtalik (Ctrl+I)', shortcut: 'Ctrl+I' },
    { icon: 'ri-underline', command: 'underline', tooltip: 'Altı çizili (Ctrl+U)', shortcut: 'Ctrl+U' },
    { icon: 'ri-strikethrough', command: 'strikeThrough', tooltip: 'Üstü çizili' },
    
    // Divider
    { type: 'divider' },
    
    // Text alignment
    { icon: 'ri-align-left', command: 'justifyLeft', tooltip: 'Sola hizala' },
    { icon: 'ri-align-center', command: 'justifyCenter', tooltip: 'Ortala' },
    { icon: 'ri-align-right', command: 'justifyRight', tooltip: 'Sağa hizala' },
    { icon: 'ri-align-justify', command: 'justifyFull', tooltip: 'İki yana yasla' },
    
    // Divider
    { type: 'divider' },
    
    // Lists
    { icon: 'ri-list-unordered', action: () => insertList(false), tooltip: 'Madde işaretli liste' },
    { icon: 'ri-list-ordered', action: () => insertList(true), tooltip: 'Numaralı liste' },
    
    // Divider
    { type: 'divider' },
    
    // Links and media
    { icon: 'ri-link', action: insertLink, tooltip: 'Link ekle' },
    { icon: 'ri-image-line', action: insertImage, tooltip: 'Resim ekle' },
    
    // Divider
    { type: 'divider' },
    
    // Undo/Redo
    { icon: 'ri-arrow-go-back-line', command: 'undo', tooltip: 'Geri al (Ctrl+Z)' },
    { icon: 'ri-arrow-go-forward-line', command: 'redo', tooltip: 'Yinele (Ctrl+Shift+Z)' },
  ];

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
            <option value="3" selected>12pt</option>
            <option value="4">14pt</option>
            <option value="5">18pt</option>
            <option value="6">24pt</option>
            <option value="7">36pt</option>
          </select>

          {/* Toolbar Buttons */}
          {toolbarButtons.map((button, index) => {
            if (button.type === 'divider') {
              return (
                <div
                  key={index}
                  className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"
                />
              );
            }

            return (
              <button
                key={index}
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
            );
          })}

          {/* Text Color */}
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

          {/* Background Color */}
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

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          className={`p-4 min-h-0 focus:outline-none text-gray-900 dark:text-white leading-relaxed ${
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
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-300 dark:border-gray-600 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Kelime sayısı: {value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Karakter sayısı: {value.replace(/<[^>]*>/g, '').length}</span>
        </div>
        
        {selectedText && (
          <div>
            Seçili: {selectedText.length} karakter
          </div>
        )}
      </div>
    </div>
  );
}
