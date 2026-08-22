export const APPS_SCRIPT_SOURCE = `// =============================================================================
// ===== META ADS SCRAPER FOR GOOGLE SHEETS ====================================
// =============================================================================
//
// REFACTORED VERSION - functionally identical to v1.0, ~50% shorter
//
// INSTALLATION:
// 1. Open Google Sheets
// 2. Extensions → Apps Script
// 3. Delete everything and paste this code
// 4. Save (Ctrl+S)
// 5. Run the "setup" function (you'll need to authorize permissions first)
// 6. Fill in the ⚙️ Setup sheet
// 7. Use the menu to scrape ads
//
// =============================================================================

// ===== CONSTANTS =============================================================

const SHEET_NAMES = {
  CONFIG: '⚙️ Setup',
  ONE_TIME: '⚡ Scrape 1-time',
  DAILY: '🔄 Scrape Daily'
};

const DEFAULT_MAX_RESULTS = 1000;
const API_PAGE_LIMIT = 1000;
const API_VERSIONS = ['v23.0', 'v22.0', 'v21.0'];
const MAX_RETRY_ATTEMPTS = 3;

// Column widths array (length = HEADERS.length, see below)
const COLUMN_WIDTHS = [
  220, // Page Name
  240, // Link Caption 1
  240, // Snapshot URL
  450  // Creative Body 1
];

const HEADERS = [
  'Page Name',
  'Link Caption 1',
  'Snapshot URL',
  'Creative Body 1'
];

// =============================================================================
// ===== USER-FACING ENTRY POINTS ==============================================
// =============================================================================

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getConfig(); // creates ⚙️ Setup if missing
  if (!ss.getSheetByName(SHEET_NAMES.ONE_TIME)) ss.insertSheet(SHEET_NAMES.ONE_TIME);
  if (!ss.getSheetByName(SHEET_NAMES.DAILY)) ss.insertSheet(SHEET_NAMES.DAILY);

  showMessage(
    '✅ Setup Complete!\\n\\n' +
    'Created sheets:\\n' +
    '• ⚙️ Setup - Configure your settings\\n' +
    '• ⚡ Scrape 1-time - Fresh scrape (overwrites)\\n' +
    '• 🔄 Scrape Daily - Historical data (appends)\\n\\n' +
    'Next steps:\\n' +
    '1. Add your Access Token in ⚙️ Setup\\n' +
    '2. Configure your search parameters\\n' +
    '3. Use the menu: 📊 Meta Ads Scraper'
  );
  onOpen();
}

function Scrape_1_time() { scrape('one-time'); }
function Scrape_Daily()  { scrape('daily'); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 Meta Ads Scraper')
    .addItem('⚙️ Setup (run once)', 'setup')
    .addSeparator()
    .addItem('⚡ Scrape 1-time', 'Scrape_1_time')
    .addItem('🔄 Scrape Daily', 'Scrape_Daily')
    .addToUi();
}

// =============================================================================
// ===== UNIFIED SCRAPE FUNCTION ===============================================
// =============================================================================

function scrape(mode) {
  const config = getConfig();
  const sheetName = mode === 'one-time' ? SHEET_NAMES.ONE_TIME : SHEET_NAMES.DAILY;
  const replaceFirstBatch = mode === 'one-time';

  if (!config.accessToken || config.accessToken === 'PASTE YOUR META API TOKEN HERE') {
    showMessage('❌ Error: You must fill in the accessToken in the ⚙️ Setup sheet!');
    return;
  }

  // Resolve date range
  const dateRange = calculateDateRange(
    config.timePeriod || 'last_7_days',
    config.startDate,
    config.endDate
  );
  config.startDate = ensureDateString(dateRange.startDate);
  config.endDate = ensureDateString(dateRange.endDate);

  Logger.log('Mode: ' + mode + ' | Period: ' + config.startDate + ' to ' + config.endDate);
  Logger.log('Search type: ' + config.searchType);

  try {
    let totalAdsCount = 0;
    let pageIdsProcessed = 0;
    const isPageSearch = config.searchType === 'page' && config.pageIds && config.pageIds.length > 0;

    if (isPageSearch) {
      for (let i = 0; i < config.pageIds.length; i++) {
        const pageConfig = Object.assign({}, config, { pageId: config.pageIds[i] });
        Logger.log('Fetching Page ID ' + (i + 1) + '/' + config.pageIds.length + ': ' + pageConfig.pageId);

        const videoIds = fetchVideoAdIds(pageConfig);
        const data = fetchAdsWithRetry(pageConfig);

        if (data && data.data && data.data.length > 0) {
          const processed = processAds(data.data, config, videoIds);
          const replace = replaceFirstBatch && i === 0;
          writeToSheet(processed, sheetName, replace);
          totalAdsCount += processed.length;
          pageIdsProcessed++;
          Logger.log('Wrote ' + processed.length + ' ads for Page ID: ' + pageConfig.pageId);
        }
      }
    } else {
      // Keyword search - single API call
      const videoIds = fetchVideoAdIds(config);
      const data = fetchAdsWithRetry(config);
      if (data && data.data && data.data.length > 0) {
        const processed = processAds(data.data, config, videoIds);
        writeToSheet(processed, sheetName, replaceFirstBatch);
        totalAdsCount = processed.length;
      }
    }

    if (totalAdsCount === 0) {
      showMessage('⚠️ No ads found for the selected period.');
      return;
    }

    const multiPageNote = (isPageSearch && config.pageIds.length > 1)
      ? 'From ' + pageIdsProcessed + '/' + config.pageIds.length + ' Page ID(s)\\n'
      : '';

    if (mode === 'one-time') {
      showMessage(
        '✅ Done!\\n\\n' +
        'Fetched ' + totalAdsCount + ' ads\\n' +
        multiPageNote +
        'Results are in the "' + sheetName + '" sheet\\n' +
        '(Previous data was replaced)'
      );
    } else {
      showMessage(
        '✅ Done!\\n\\n' +
        'Fetched ' + totalAdsCount + ' ads\\n' +
        multiPageNote +
        'Added ' + totalAdsCount + ' rows to "' + sheetName + '"'
      );
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    const errorMsg = error.toString();

    if (errorMsg.indexOf('reduce the amount of data') !== -1) {
      showMessage(
        "❌ Meta API: 'Reduce the amount of data' error.\\n\\n" +
        "Too much data requested. Try one of these:\\n\\n" +
        "  1. Shorter date range\\n" +
        "     (e.g., 1 month or 2 weeks instead of 4 months)\\n\\n" +
        "  2. Fewer Page IDs\\n" +
        "     (e.g., scrape 1-2 competitors at a time\\n" +
        "      instead of all of them at once)\\n\\n" +
        "Then run the scrape again."
      );
    } else {
      showMessage('❌ Error: ' + errorMsg);
    }
  }
}

// =============================================================================
// ===== CONFIGURATION SHEET ===================================================
// =============================================================================

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!configSheet) configSheet = createConfigSheet(ss);

  const values = configSheet.getRange('A1:B27').getValues();
  const labelToKey = {
    '  Access Token': 'accessToken',
    '  Search Type': 'searchType',
    '  Page IDs': 'pageIds',
    '  Page ID': 'pageIds',
    '  Search Terms': 'searchTerms',
    '  Keyword Match': 'keywordSearchType',
    '  Time Period': 'timePeriod',
    '  Start Date': 'startDate',
    '  End Date': 'endDate',
    '  Countries': 'countries',
    '  Languages': 'languages',
    '  Media Type': 'mediaType',
    '  Platforms': 'publisherPlatforms',
    '  Ad Status': 'adActiveStatus',
    '  Max Results': 'maxResults'
  };

  const config = {};
  values.forEach(row => {
    const key = labelToKey[row[0]];
    let value = row[1];
    if (!key || value === '') return;

    if (key === 'countries' || key === 'languages' || key === 'publisherPlatforms') {
      try { value = JSON.parse(value); } catch (e) { value = []; }
    }
    if (key === 'pageIds') {
      value = String(value).split(',').map(id => id.trim()).filter(id => id !== '');
    }
    config[key] = value;
  });

  return config;
}

function createConfigSheet(ss) {
  const configSheet = ss.insertSheet(SHEET_NAMES.CONFIG);
  const defaultCountries = '["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","GB"]';

  configSheet.getRange('A1:C27').setValues([
    ['  META ADS LIBRARY SCRAPER', '', ''],
    ['  ▶ New here? Watch a video on how to use this sheet', '', ''],
    ['  Configure your scraping parameters below', '', ''],
    ['  🔐 AUTHENTICATION', '', ''],
    ['  Access Token', 'PASTE YOUR META API TOKEN HERE', 'Steps to get your token: https://www.facebook.com/ads/library/api/'],
    ['  🎯 SEARCH SETTINGS', '', ''],
    ['  Search Type', 'page', 'Pick one: "page" to search by company Page ID, or "keyword" to search by terms'],
    ['  Page IDs', '', 'If "page" selected above. Comma-separated for multiple (e.g. 183869772601, 123456789012). Find in: Facebook Page → About → Page Transparency'],
    ['  Search Terms', '', 'If "keyword" selected, enter search query (e.g. "protein powder"). If "page" selected, leave empty'],
    ['  Keyword Match', 'KEYWORD_UNORDERED', 'If "keyword" selected above, choose match type. UNORDERED: any word order | EXACT_PHRASE: exact match only'],
    ['  📅 TIME RANGE', '', ''],
    ['  Time Period', 'custom', 'Quick select or choose "custom" for manual dates'],
    ['  Start Date', '2026-01-01', 'Format: YYYY-MM-DD (only when Time Period = custom)'],
    ['  End Date', '2026-01-01', 'Format: YYYY-MM-DD (only when Time Period = custom)'],
    ['  ⚙️ FILTERS', '', ''],
    ['  Countries', defaultCountries, 'Example format (e.g. "GB", "DE", "FR"). [] = all. Data available only for EU & UK due to transparency requirements.'],
    ['  Languages', '[]', 'Example format (e.g. "en", "de"). Recommend [] for all'],
    ['  Media Type', 'ALL', 'ALL = everything, IMAGE = static without text, MEME = image with text overlay, VIDEO = video'],
    ['  Platforms', '[]', 'Example format ["FACEBOOK","INSTAGRAM"] etc. [] = all platforms'],
    ['  Ad Status', 'ALL', 'ACTIVE = still running today (regardless of date range), INACTIVE = stopped, ALL = both'],
    ['  Max Results', '5000', 'Pick maximum number of ads to fetch (max 5000)'],
    ['  💡 QUICK HELP', '', ''],
    ['  →', 'For one-time scrape with 3 Page IDs, scrape max 2 weeks – 1 month (anything longer may hit Meta API limits). Safe zone: ~1000 ads/Page ID = ~3000 rows total', ''],
    ['  →', 'Search Type = "page" uses Page ID only (Search Terms ignored)', ''],
    ['  →', 'Search Type = "keyword" uses Search Terms (Page ID ignored)', ''],
    ['  →', '⚡ Scrape 1-time: Fetches ads → replaces all rows each run. Best for one-time analysis', ''],
    ['  →', '🔄 Scrape Daily: Fetches ads → adds new rows (never overwrites). Best for daily tracking', '']
  ]);
  return configSheet;
}
`;
