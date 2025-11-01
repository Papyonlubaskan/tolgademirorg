export interface BookSchema {
  '@context': string;
  '@type': string;
  name: string;
  author: {
    '@type': string;
    name: string;
  };
  description: string;
  image?: string;
  datePublished?: string;
  publisher: {
    '@type': string;
    name: string;
  };
  genre?: string;
  isbn?: string;
  url?: string;
}

export interface PersonSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  image?: string;
  sameAs?: string[];
  jobTitle?: string;
  worksFor?: {
    '@type': string;
    name: string;
  };
}

export interface WebsiteSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
  };
  potentialAction: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  logo?: string;
  contactPoint?: {
    '@type': string;
    telephone?: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

export class StructuredDataGenerator {
  // Kitap için JSON-LD schema
  static generateBookSchema(book: {
    title: string;
    author: string;
    description: string;
    coverImage?: string;
    publishDate?: string;
    genre?: string;
    isbn?: string;
    url?: string;
  }): BookSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      author: {
        '@type': 'Person',
        name: book.author
      },
      description: book.description,
      image: book.coverImage,
      datePublished: book.publishDate,
      publisher: {
        '@type': 'Organization',
        name: 'Tolga Demir'
      },
      genre: book.genre,
      isbn: book.isbn,
      url: book.url
    };
  }

  // Yazar için JSON-LD schema
  static generatePersonSchema(person: {
    name: string;
    description: string;
    url: string;
    image?: string;
    socialLinks?: string[];
    jobTitle?: string;
  }): PersonSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      description: person.description,
      url: person.url,
      image: person.image,
      sameAs: person.socialLinks,
      jobTitle: person.jobTitle || 'Yazar',
      worksFor: {
        '@type': 'Organization',
        name: 'Tolga Demir'
      }
    };
  }

  // Website için JSON-LD schema
  static generateWebsiteSchema(site: {
    name: string;
    description: string;
    url: string;
    author: string;
  }): WebsiteSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      description: site.description,
      url: site.url,
      author: {
        '@type': 'Person',
        name: site.author
      },
      publisher: {
        '@type': 'Organization',
        name: site.name
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${site.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }

  // Organizasyon için JSON-LD schema
  static generateOrganizationSchema(org: {
    name: string;
    description: string;
    url: string;
    logo?: string;
    email?: string;
    phone?: string;
    socialLinks?: string[];
  }): OrganizationSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      description: org.description,
      url: org.url,
      logo: org.logo,
      contactPoint: org.email || org.phone ? {
        '@type': 'ContactPoint',
        telephone: org.phone,
        contactType: 'customer service',
        email: org.email
      } : undefined,
      sameAs: org.socialLinks
    };
  }

  // Breadcrumb schema
  static generateBreadcrumbSchema(breadcrumbs: Array<{
    name: string;
    url: string;
  }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }

  // FAQ schema
  static generateFAQSchema(faqs: Array<{
    question: string;
    answer: string;
  }>): any {
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

  // Article schema
  static generateArticleSchema(article: {
    title: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url: string;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Tolga Demir',
        logo: {
          '@type': 'ImageObject',
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`
        }
      },
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      image: article.image,
      url: article.url
    };
  }

  // Event schema
  static generateEventSchema(event: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    location?: {
      name: string;
      address?: string;
    };
    organizer: {
      name: string;
      url: string;
    };
    url: string;
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location ? {
        '@type': 'Place',
        name: event.location.name,
        address: event.location.address
      } : undefined,
      organizer: {
        '@type': 'Organization',
        name: event.organizer.name,
        url: event.organizer.url
      },
      url: event.url
    };
  }

  // Multiple schemas'ı birleştir
  static combineSchemas(schemas: any[]): any[] {
    return schemas.filter(schema => schema !== null && schema !== undefined);
  }

  // Schema'yı HTML'e dönüştür
  static schemaToHTML(schema: any): string {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  // Multiple schemas'ı HTML'e dönüştür
  static schemasToHTML(schemas: any[]): string {
    return schemas
      .map(schema => this.schemaToHTML(schema))
      .join('\n');
  }

  // Open Graph meta tags
  static generateOpenGraphTags(data: {
    title: string;
    description: string;
    url: string;
    image?: string;
    type?: string;
    siteName?: string;
    locale?: string;
  }): Array<{ property: string; content: string }> {
    const tags = [
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:url', content: data.url },
      { property: 'og:type', content: data.type || 'website' },
      { property: 'og:site_name', content: data.siteName || 'Tolga Demir' },
      { property: 'og:locale', content: data.locale || 'tr_TR' }
    ];

    if (data.image) {
      tags.push({ property: 'og:image', content: data.image });
      tags.push({ property: 'og:image:width', content: '1200' });
      tags.push({ property: 'og:image:height', content: '630' });
    }

    return tags;
  }

  // Twitter Card meta tags
  static generateTwitterCardTags(data: {
    title: string;
    description: string;
    image?: string;
    card?: string;
    site?: string;
    creator?: string;
  }): Array<{ name: string; content: string }> {
    const tags = [
      { name: 'twitter:card', content: data.card || 'summary_large_image' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description }
    ];

    if (data.site) {
      tags.push({ name: 'twitter:site', content: data.site });
    }

    if (data.creator) {
      tags.push({ name: 'twitter:creator', content: data.creator });
    }

    if (data.image) {
      tags.push({ name: 'twitter:image', content: data.image });
    }

    return tags;
  }
}

export const structuredDataGenerator = StructuredDataGenerator;
