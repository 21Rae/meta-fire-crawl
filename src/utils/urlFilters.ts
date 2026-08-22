/**
 * Utility functions to detect and drop Facebook, Instagram, Meta-owned social links,
 * as well as Google Play Store and Apple App Store links to prevent wasting
 * Firecrawl API tokens/credits on non-target lead websites.
 */

export const META_SOCIAL_DOMAINS = [
  'facebook.com',
  'fb.com',
  'fb.me',
  'fb.watch',
  'fb.gg',
  'm.facebook.com',
  'l.facebook.com',
  'lm.facebook.com',
  'web.facebook.com',
  'touch.facebook.com',
  'business.facebook.com',
  'instagram.com',
  'instagr.am',
  'ig.me',
  'threads.net',
  'messenger.com',
  'meta.com',
  'whatsapp.com'
];

export const APP_STORE_DOMAINS = [
  'play.google.com',
  'market.android.com',
  'apps.apple.com',
  'itunes.apple.com',
  'appstore.com',
  'testflight.apple.com',
  'apple.co',
  'itunes.com'
];

export type LinkExclusionReason = 'meta_social' | 'app_store' | 'invalid' | null;

/**
 * Checks if a link belongs to Google Play or Apple App Store.
 */
export function isAppStoreLink(rawLink: string): boolean {
  if (!rawLink || typeof rawLink !== 'string') return false;
  const link = rawLink.trim().toLowerCase();
  
  if (
    link.includes('play.google.com') ||
    link.includes('apps.apple.com') ||
    link.includes('itunes.apple.com') ||
    link.includes('appstore.com') ||
    link.includes('testflight.apple.com') ||
    link.includes('apple.co/app') ||
    link.includes('market.android.com')
  ) {
    return true;
  }

  try {
    const cleanLink = link.replace(/^['"]+|['"]+$/g, '');
    const parsed = new URL(cleanLink.startsWith('http') ? cleanLink : `https://${cleanLink}`);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./i, '');
    
    if (APP_STORE_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return true;
    }
  } catch {
    // Ignore URL parse failures
  }

  return false;
}

/**
 * Checks if a link is Facebook, Instagram, or Meta.
 */
export function isMetaSocialLink(rawLink: string): boolean {
  if (!rawLink || typeof rawLink !== 'string') return true;
  const link = rawLink.trim().toLowerCase();
  
  if (!link || link === '-' || link === '—' || link === 'n/a' || link === 'none') {
    return true;
  }

  const cleanLink = link.replace(/^['"]+|['"]+$/g, '');

  if (
    cleanLink.startsWith('facebook.com') ||
    cleanLink.startsWith('www.facebook.com') ||
    cleanLink.startsWith('m.facebook.com') ||
    cleanLink.startsWith('fb.com') ||
    cleanLink.startsWith('fb.me') ||
    cleanLink.startsWith('instagram.com') ||
    cleanLink.startsWith('www.instagram.com') ||
    cleanLink.startsWith('instagr.am') ||
    cleanLink.startsWith('ig.me') ||
    cleanLink.startsWith('threads.net') ||
    cleanLink.startsWith('meta.com')
  ) {
    return true;
  }

  try {
    const parsed = new URL(cleanLink.startsWith('http') ? cleanLink : `https://${cleanLink}`);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./i, '');
    if (META_SOCIAL_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return true;
    }
  } catch {
    if (
      cleanLink.includes('facebook.com') ||
      cleanLink.includes('fb.com/') ||
      cleanLink.includes('fb.me/') ||
      cleanLink.includes('instagram.com') ||
      cleanLink.includes('instagr.am/') ||
      cleanLink.includes('ig.me/')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Comprehensive check for excluded non-lead links (Meta/IG + Google Play + Apple App Store).
 */
export function isMetaOrSocialLink(rawLink: string): boolean {
  if (!rawLink || typeof rawLink !== 'string') return true;
  const link = rawLink.trim().toLowerCase();
  if (!link || link === '-' || link === '—' || link === 'n/a' || link === 'none') {
    return true;
  }
  return isMetaSocialLink(rawLink) || isAppStoreLink(rawLink);
}

/**
 * Categorize why a link should be dropped/skipped.
 */
export function getLinkExclusionReason(rawLink: string): LinkExclusionReason {
  if (!rawLink || typeof rawLink !== 'string') return 'invalid';
  const link = rawLink.trim().toLowerCase();
  if (!link || link === '-' || link === '—' || link === 'n/a' || link === 'none') return 'invalid';
  
  if (isAppStoreLink(rawLink)) return 'app_store';
  if (isMetaSocialLink(rawLink)) return 'meta_social';
  return null;
}

/**
 * Returns a human-readable clean target domain or URL.
 */
export function getCleanDomainOrUrl(rawLink: string): string {
  if (!rawLink) return '';
  const trimmed = rawLink.trim();
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] || trimmed;
  }
}
