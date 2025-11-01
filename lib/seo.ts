// SEO Meta Tags Utility
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

// Default SEO data
const defaultSEO: SEOData = {
  title: 'Tolga Demir - Yazar & Hikaye Anlatıcı',
  description: 'Tolga Demir\'nın kitapları, hikayeleri ve yazıları. Türk edebiyatının önemli isimlerinden biri olan yazarın eserlerini keşfedin.',
  keywords: ['Tolga Demir', 'yazar', 'kitap', 'hikaye', 'edebiyat', 'türk edebiyatı'],
  image: '/images/og-image.jpg',
  url: 'https://tolgademir.org',
  type: 'website',
  author: 'Tolga Demir',
  canonical: 'https://tolgademir.org'
};

// Generate meta tags for different page types
export function generateMetaTags(seoData: Partial<SEOData> = {}): any {
  const data = { ...defaultSEO, ...seoData };
  
  const metaTags = [
    // Basic meta tags
    { name: 'description', content: data.description },
    { name: 'keywords', content: data.keywords?.join(', ') },
    { name: 'author', content: data.author },
    { name: 'robots', content: `${data.noindex ? 'noindex' : 'index'}, ${data.nofollow ? 'nofollow' : 'follow'}` },
    
    // Open Graph tags
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:type', content: data.type },
    { property: 'og:url', content: data.url },
    { property: 'og:image', content: data.image },
    { property: 'og:site_name', content: 'Tolga Demir' },
    { property: 'og:locale', content: 'tr_TR' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.description },
    { name: 'twitter:image', content: data.image },
    { name: 'twitter:creator', content: '@tolgademir1914' },
    
    // Additional meta tags
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#ea580c' },
    { name: 'msapplication-TileColor', content: '#ea580c' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Tolga Demir' },
  ];

  // Add article specific tags
  if (data.type === 'article' || data.type === 'book') {
    metaTags.push(
      { property: 'article:author', content: data.author },
      { property: 'article:published_time', content: data.publishedTime },
      { property: 'article:modified_time', content: data.modifiedTime },
      { property: 'article:section', content: data.section },
    );
    
    // Add tags
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        metaTags.push({ property: 'article:tag', content: tag });
      });
    }
  }

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords?.join(', '),
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.url,
      siteName: 'Tolga Demir',
      images: [
        {
          url: data.image,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
      locale: 'tr_TR',
      type: data.type,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: [data.image],
      creator: '@tolgademir',
    },
    robots: {
      index: !data.noindex,
      follow: !data.nofollow,
      googleBot: {
        index: !data.noindex,
        follow: !data.nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    canonical: data.canonical,
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'Tolga Demir',
      'msapplication-TileColor': '#ea580c',
      'theme-color': '#ea580c',
    },
  };
}

// Generate structured data (JSON-LD)
export function generateStructuredData(seoData: Partial<SEOData> = {}): any {
  const data = { ...defaultSEO, ...seoData };
  
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Tolga Demir',
    jobTitle: 'Yazar & Hikaye Anlatıcı',
    description: 'Türk edebiyatının önemli isimlerinden biri olan yazar ve hikaye anlatıcısı.',
    url: 'https://tolgademir.org',
    image: 'https://tolgademir.org/profile-image.jpg',
    sameAs: [
      'https://www.instagram.com/tolgademir1914',
      'https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e'
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Tolga Demir'
    }
  };

  if (data.type === 'book') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: data.title,
      description: data.description,
      author: {
        '@type': 'Person',
        name: data.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Tolga Demir'
      },
      datePublished: data.publishedTime,
      dateModified: data.modifiedTime,
      image: data.image,
      url: data.url,
      isbn: data.keywords?.find(k => k.match(/^\d{13}$/)) || undefined,
      genre: data.section,
      keywords: data.keywords?.join(', '),
      inLanguage: 'tr',
      bookFormat: 'EBook',
      numberOfPages: undefined, // Will be filled from book data
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1'
      }
    };
  }

  if (data.type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      author: {
        '@type': 'Person',
        name: data.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Tolga Demir',
        logo: {
          '@type': 'ImageObject',
          url: 'https://tolgademir.org/images/logo.png'
        }
      },
      datePublished: data.publishedTime,
      dateModified: data.modifiedTime,
      image: data.image,
      url: data.url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url
      },
      articleSection: data.section,
      keywords: data.keywords?.join(', '),
      inLanguage: 'tr'
    };
  }

  return baseStructuredData;
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// Generate organization structured data
export function generateOrganizationStructuredData(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tolga Demir',
    url: 'https://tolgademir.org',
    logo: 'https://tolgademir.org/images/logo.png',
    description: 'Türk edebiyatının önemli isimlerinden biri olan yazar ve hikaye anlatıcısı.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-XXX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: 'Turkish'
    },
    sameAs: [
      'https://www.instagram.com/tolgademir1914',
      'https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TR',
      addressLocality: 'İstanbul'
    }
  };
}

// Generate website structured data
export function generateWebsiteStructuredData(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tolga Demir',
    url: 'https://tolgademir.org',
    description: 'Tolga Demir\'nın kitapları, hikayeleri ve yazıları.',
    author: {
      '@type': 'Person',
      name: 'Tolga Demir'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tolgademir.org/kitaplar?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

// Generate book series structured data
export function generateBookSeriesStructuredData(books: Array<{
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
}>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BookSeries',
    name: 'Tolga Demir Kitapları',
    description: 'Tolga Demir\'nın tüm kitapları ve hikayeleri.',
    author: {
      '@type': 'Person',
      name: 'Tolga Demir'
    },
    numberOfItems: books.length,
    book: books.map(book => ({
      '@type': 'Book',
      name: book.title,
      description: book.description,
      url: book.url,
      image: book.image,
      datePublished: book.datePublished,
      author: {
        '@type': 'Person',
        name: 'Tolga Demir'
      }
    }))
  };
}

// Generate reading list structured data
export function generateReadingListStructuredData(books: Array<{
  title: string;
  url: string;
  image: string;
  author: string;
  datePublished: string;
}>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tolga Demir Kitapları',
    description: 'Tolga Demir\'nın tüm kitapları.',
    numberOfItems: books.length,
    itemListElement: books.map((book, index) => ({
      '@type': 'Book',
      position: index + 1,
      name: book.title,
      url: book.url,
      image: book.image,
      author: {
        '@type': 'Person',
        name: book.author
      },
      datePublished: book.datePublished
    }))
  };
}

// Utility function to truncate text for meta descriptions
export function truncateText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Utility function to generate keywords from content
export function generateKeywords(content: string, additionalKeywords: string[] = []): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const sortedWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  return [...new Set([...sortedWords, ...additionalKeywords])];
}

// Utility function to generate canonical URL
export function generateCanonicalURL(path: string): string {
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org';
  return `${baseURL}${path}`;
}
