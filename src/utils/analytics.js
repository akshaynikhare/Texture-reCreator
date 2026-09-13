/**
 * Google Analytics 4 (GA4) Tracker
 * Provides safe event logging that gracefully degrades if gtag is blocked or unavailable.
 */

export function trackEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, {
        timestamp: new Date().toISOString(),
        ...params,
      });
    } catch (error) {
      console.debug('Analytics dispatch error:', error);
    }
  }
}

export function trackPageView(pagePath, pageTitle) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', 'page_view', {
        page_path: pagePath || window.location.pathname,
        page_title: pageTitle || document.title,
      });
    } catch (error) {
      console.debug('Analytics pageview error:', error);
    }
  }
}
