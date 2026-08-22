export interface ScraperConfig {
  accessToken: string;
  firecrawlApiKey?: string;
  autoDropSocialLinks?: boolean;
  searchType: 'page' | 'keyword';
  pageIds: string[];
  searchTerms: string;
  keywordSearchType: 'KEYWORD_UNORDERED' | 'KEYWORD_EXACT_PHRASE';
  timePeriod: string;
  startDate: string;
  endDate: string;
  countries: string[];
  languages: string[];
  mediaType: 'ALL' | 'IMAGE' | 'VIDEO' | 'MEME';
  publisherPlatforms: string[];
  adActiveStatus: 'ALL' | 'ACTIVE' | 'INACTIVE';
  maxResults: number;
}

export interface ExtractedEmailResult {
  url: string;
  originalLink: string;
  pageName?: string;
  adId?: string;
  status: 'idle' | 'scraping' | 'completed' | 'failed' | 'skipped';
  isSocialLink?: boolean;
  isAppStoreLink?: boolean;
  exclusionType?: 'meta_social' | 'app_store' | 'none';
  emails: string[];
  source?: 'firecrawl' | 'simulated';
  title?: string;
  description?: string;
  error?: string;
  timestamp?: string;
}

export interface AdRecord {
  id: string;
  adCreationTime: string;
  adDeliveryStartTime: string;
  adDeliveryStopTime: string;
  adStatus: 'active' | 'inactive' | 'scheduled' | 'unknown';
  isActive: number;
  isInactive: number;
  adCount: number;
  pageName: string;
  pageId: string;
  languages: string;
  creativeBody1: string;
  creativeBody2: string;
  creativeBody3: string;
  creativeBody4: string;
  creativeBody5: string;
  linkCaption1: string;
  linkCaption2: string;
  linkCaption3: string;
  linkCaption4: string;
  linkCaption5: string;
  linkDescription1: string;
  linkDescription2: string;
  linkDescription3: string;
  linkDescription4: string;
  linkDescription5: string;
  linkTitle1: string;
  linkTitle2: string;
  linkTitle3: string;
  linkTitle4: string;
  linkTitle5: string;
  platform1: string;
  platform2: string;
  platform3: string;
  platform4: string;
  platform5: string;
  totalReach: number;
  snapshotUrl: string;
  scrapedPeriodStart: string;
  scrapedPeriodEnd: string;
  scrapedAt: string;
  searchType: string;
  searchQuery: string;
  daysRunning: number | string;
  avgDailyReach: number | string;
  isFreshData: number;
  isVideo: number;
  mediaType: 'VIDEO' | 'IMAGE' | 'MEME';
  incrementalReach?: number | string;
  countries: string;
  extractedEmails?: string[];
  age1824Male: number;
  age1824Female: number;
  age2534Male: number;
  age2534Female: number;
  age3544Male: number;
  age3544Female: number;
  age4554Male: number;
  age4554Female: number;
  age5564Male: number;
  age5564Female: number;
  age65Male: number;
  age65Female: number;
  totalMale: number;
  totalFemale: number;
  totalAge1824: number;
  totalAge2534: number;
  totalAge3544: number;
  totalAge4554: number;
  totalAge5564: number;
  totalAge65: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export type ActiveTab = 
  | 'setup'
  | 'one-time'
  | 'daily'
  | 'firecrawl'
  | 'cards'
  | 'analytics'
  | 'ai-insights'
  | 'appscript';
