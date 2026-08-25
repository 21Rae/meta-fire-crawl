export const SHEET_NAMES = {
  CONFIG: '⚙️ Setup',
  ONE_TIME: '⚡ Scrape 1-time',
  DAILY: '🔄 Scrape Daily'
};

export const DEFAULT_MAX_RESULTS = 1000;
export const API_PAGE_LIMIT = 1000;
export const API_VERSIONS = ['v23.0', 'v22.0', 'v21.0'];
export const MAX_RETRY_ATTEMPTS = 3;

export const DEFAULT_EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
  'RO', 'SK', 'SI', 'ES', 'SE', 'GB'
];

export const ALL_COUNTRIES_LIST = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

export const HEADERS = [
  'Page Name',
  'Link Caption 1',
  'Snapshot URL',
  'Creative Body 1'
];

export const COLUMN_WIDTHS = [
  220, // Page Name
  240, // Link Caption 1
  240, // Snapshot URL
  450  // Creative Body 1
];

export const DEFAULT_CONFIG = {
  accessToken: '',
  firecrawlApiKey: '',
  autoDropSocialLinks: true,
  searchType: 'keyword' as const,
  pageIds: [],
  searchTerms: 'protein powder',
  keywordSearchType: 'KEYWORD_UNORDERED' as const,
  timePeriod: 'last_30_days',
  startDate: '2026-07-16',
  endDate: '2026-08-15',
  countries: DEFAULT_EU_COUNTRIES,
  languages: [],
  mediaType: 'ALL' as const,
  publisherPlatforms: ['FACEBOOK', 'INSTAGRAM'],
  adActiveStatus: 'ALL' as const,
  maxResults: 1000
};
