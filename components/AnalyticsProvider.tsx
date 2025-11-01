'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsManager } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    
    analyticsManager.trackPageView(pathname, pageTitle, pageUrl);
  }, [pathname]);

  return <>{children}</>;
}

// Analytics hook
export function useAnalytics() {
  const trackEvent = (action: string, category: string, label?: string, value?: number, customParameters?: Record<string, any>) => {
    analyticsManager.trackEvent({
      action,
      category,
      label,
      value,
      customParameters
    });
  };

  const trackCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    analyticsManager.trackCustomEvent(eventName, parameters);
  };

  const trackBookView = (bookId: string, bookTitle: string) => {
    analyticsManager.trackBookView(bookId, bookTitle);
  };

  const trackChapterRead = (bookId: string, chapterId: string, chapterTitle: string) => {
    analyticsManager.trackChapterRead(bookId, chapterId, chapterTitle);
  };

  const trackSearch = (query: string, resultsCount: number) => {
    analyticsManager.trackSearch(query, resultsCount);
  };

  const trackNewsletterSubscription = (email: string) => {
    analyticsManager.trackNewsletterSubscription(email);
  };

  const trackContactForm = (name: string, subject: string) => {
    analyticsManager.trackContactForm(name, subject);
  };

  const trackDownload = (fileName: string, fileType: string) => {
    analyticsManager.trackDownload(fileName, fileType);
  };

  const trackSocialShare = (platform: string, content: string) => {
    analyticsManager.trackSocialShare(platform, content);
  };

  const setUserProperties = (properties: any) => {
    analyticsManager.setUserProperties(properties);
  };

  return {
    trackEvent,
    trackCustomEvent,
    trackBookView,
    trackChapterRead,
    trackSearch,
    trackNewsletterSubscription,
    trackContactForm,
    trackDownload,
    trackSocialShare,
    setUserProperties
  };
}
