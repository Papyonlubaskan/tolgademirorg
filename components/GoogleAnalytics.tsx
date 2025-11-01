import Script from 'next/script';
import { useState, useEffect } from 'react';

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  if (!GA_ID) {
    return null; // Don't render if GA_ID is not set
  }

  // Check cookie consent
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setHasConsent(consent === 'accepted');
  }, []);

  if (!hasConsent) {
    return null; // Don't load GA without consent
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=None;Secure',
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
          });
        `}
      </Script>
    </>
  );
}

// Analytics events helper
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

// Predefined events
export const analytics = {
  bookView: (bookId: string, title: string) => {
    trackEvent('book_view', { book_id: bookId, book_title: title });
  },
  
  chapterRead: (chapterId: string, title: string) => {
    trackEvent('chapter_read', { chapter_id: chapterId, chapter_title: title });
  },
  
  likeAction: (itemType: 'book' | 'chapter', itemId: string, action: 'like' | 'unlike') => {
    trackEvent('like_action', { item_type: itemType, item_id: itemId, action });
  },
  
  commentAdd: (itemType: 'book' | 'chapter', itemId: string) => {
    trackEvent('comment_add', { item_type: itemType, item_id: itemId });
  },
  
  newsletterSubscribe: (email: string) => {
    trackEvent('newsletter_subscribe', { email_hash: btoa(email) });
  },
  
  socialShare: (platform: string, url: string) => {
    trackEvent('social_share', { platform, url });
  },
};
