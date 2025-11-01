'use client';

import { useEffect } from 'react';

interface SEOStructuredDataProps {
  type?: 'homepage' | 'about' | 'books' | 'book' | 'contact' | 'article' | 'blog' | 'person' | 'website';
  bookData?: {
    title: string;
    author: string;
    description: string;
    publishedDate?: string;
    isbn?: string;
  };
}

export default function SEOStructuredData({ type = 'homepage', bookData }: SEOStructuredDataProps) {
  useEffect(() => {
    const baseUrl = 'https://tolgademir.org';
    
    let structuredData: any = {};

    switch (type) {
      case 'homepage':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Tolga Demir",
          "jobTitle": "Yazar",
          "description": "Türk edebiyatı yazarı, çağdaş Türk edebiyatının önemli isimlerinden",
          "url": baseUrl,
          "image": `${baseUrl}/profile-image.jpg`,
          "sameAs": [
            "https://www.instagram.com/tolgademir1914",
            "https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e"
          ],
          "knowsAbout": [
            "Türk edebiyatı",
            "Fantastik roman",
            "Çağdaş edebiyat",
            "Yazarlık",
            "Roman yazımı"
          ],
          "alumniOf": "Türk edebiyatı",
          "award": [
            "Çağdaş Türk edebiyatı yazarı",
            "Fantastik roman yazarı"
          ]
        };
        break;

      case 'about':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Tolga Demir",
          "jobTitle": "Yazar",
          "description": "Tolga Demir kimdir? Türk edebiyatının yükselen yıldızı, fantastik roman yazarı. Biyografisi ve yazarlık yolculuğu.",
          "url": `${baseUrl}/hakkimda`,
          "image": `${baseUrl}/profile-image.jpg`,
          "birthPlace": "Türkiye",
          "nationality": "Türk",
          "occupation": "Yazar",
          "genre": ["Fantastik roman", "Çağdaş edebiyat", "Türk edebiyatı"],
          "works": []
        };
        break;

      case 'books':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Tolga Demir Kitapları",
          "description": "Tolga Demir'nın tüm kitapları, romanları ve eserleri. Çağdaş Türk edebiyatının önemli eserlerini keşfedin.",
          "url": `${baseUrl}/kitaplar`,
          "mainEntity": {
            "@type": "Person",
            "name": "Tolga Demir",
            "jobTitle": "Yazar"
          }
        };
        break;

      case 'book':
        if (bookData) {
          structuredData = {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": bookData.title,
            "author": {
              "@type": "Person",
              "name": bookData.author,
              "url": baseUrl
            },
            "description": bookData.description,
            "publisher": {
              "@type": "Organization",
              "name": "Ephesus Yayınları"
            },
            "datePublished": bookData.publishedDate || "2023",
            "isbn": bookData.isbn,
            "inLanguage": "tr",
            "genre": "Fantastik Roman",
            "url": `${baseUrl}/kitaplar/${bookData.title.toLowerCase().replace(/\s+/g, '-')}`
          };
        }
        break;

      case 'contact':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Tolga Demir İletişim",
          "description": "Tolga Demir ile iletişime geçin. Yazar hakkında sorularınız için iletişim bilgileri.",
          "url": `${baseUrl}/iletisim`,
          "mainEntity": {
            "@type": "Person",
            "name": "Tolga Demir",
            "jobTitle": "Yazar"
          }
        };
        break;

      case 'article':
      case 'blog':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Tolga Demir Blog",
          "description": "Tolga Demir'nın yazarlık yolculuğu, kitapları ve edebiyat üzerine düşünceleri.",
          "url": `${baseUrl}/blog`,
          "author": {
            "@type": "Person",
            "name": "Tolga Demir",
            "jobTitle": "Yazar"
          },
          "publisher": {
            "@type": "Person",
            "name": "Tolga Demir"
          }
        };
        break;

      case 'person':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Tolga Demir",
          "jobTitle": "Yazar",
          "description": "Türk edebiyatı yazarı, çağdaş Türk edebiyatının önemli isimlerinden",
          "url": baseUrl,
          "image": `${baseUrl}/profile-image.jpg`,
          "sameAs": [
            "https://www.instagram.com/tolgademir1914",
            "https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e"
          ]
        };
        break;

      case 'website':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Tolga Demir - Yazar",
          "description": "Tolga Demir'nın resmi web sitesi. Kitapları, biyografisi ve yazarlık yolculuğu.",
          "url": baseUrl,
          "author": {
            "@type": "Person",
            "name": "Tolga Demir"
          },
          "publisher": {
            "@type": "Person",
            "name": "Tolga Demir"
          }
        };
        break;
    }

    // Mevcut structured data'yı temizle
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Yeni structured data'yı ekle
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, bookData]);

  return null;
}