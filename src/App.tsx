import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SetupSheetView } from './components/SetupSheetView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { AdCardsView } from './components/AdCardsView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AiInsightsView } from './components/AiInsightsView';
import { AppsScriptGuideView } from './components/AppsScriptGuideView';
import { FirecrawlEmailTool } from './components/FirecrawlEmailTool';
import { ScrapeProgressModal } from './components/ScrapeProgressModal';
import { ScraperConfig, AdRecord, ActiveTab, LogEntry } from './types';
import { DEFAULT_CONFIG, SHEET_NAMES } from './utils/constants';
import { INITIAL_MOCK_ADS } from './data/mockAds';
import { 
  calculateDateRange, 
  buildAdRecord, 
  exportToCsv, 
  copySpreadsheetToClipboard 
} from './utils/adProcessor';

export default function App() {
  const [config, setConfig] = useState<ScraperConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('setup');
  const [oneTimeAds, setOneTimeAds] = useState<AdRecord[]>(INITIAL_MOCK_ADS);
  const [dailyAds, setDailyAds] = useState<AdRecord[]>(INITIAL_MOCK_ADS.slice(0, 4));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [lastTargetSheet, setLastTargetSheet] = useState<string>(SHEET_NAMES.ONE_TIME);

  const addLog = (message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toTimeString().split(' ')[0],
      level,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleUpdateConfig = (newConfig: Partial<ScraperConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const runScrape = async (mode: 'one-time' | 'daily') => {
    const targetSheetName = mode === 'one-time' ? SHEET_NAMES.ONE_TIME : SHEET_NAMES.DAILY;
    setLastTargetSheet(targetSheetName);
    setLogs([]);
    setScrapeError(null);
    setIsScraping(true);
    setIsLogModalOpen(true);

    // Calculate time range
    const range = calculateDateRange(config.timePeriod, config.startDate, config.endDate);
    const effectiveConfig = {
      ...config,
      startDate: range.startDate,
      endDate: range.endDate
    };

    addLog(`Mode: ${mode} | Period: ${effectiveConfig.startDate} to ${effectiveConfig.endDate}`);
    addLog(`Search type: ${effectiveConfig.searchType}`);

    try {
      let fetchedAds: AdRecord[] = [];
      const hasLiveToken = effectiveConfig.accessToken && effectiveConfig.accessToken !== 'PASTE YOUR META API TOKEN HERE';

      if (hasLiveToken) {
        addLog(`Attempting live Meta Graph API connection...`);
        const isPageSearch = effectiveConfig.searchType === 'page' && effectiveConfig.pageIds.length > 0;

        if (isPageSearch) {
          for (let i = 0; i < effectiveConfig.pageIds.length; i++) {
            const pageId = effectiveConfig.pageIds[i];
            addLog(`Fetching Page ID ${i + 1}/${effectiveConfig.pageIds.length}: ${pageId}`);
            
            const response = await fetch('/api/meta/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: { ...effectiveConfig, pageId },
                overrides: { maxResults: effectiveConfig.maxResults }
              })
            });

            const result = await response.json();
            if (result.error) {
              throw new Error(result.error);
            }

            if (result.data && result.data.length > 0) {
              const videoIds = new Set<string>();
              result.data.forEach((ad: any) => {
                if (ad.mediaType === 'VIDEO') videoIds.add(ad.id);
              });

              const processed = result.data.map((ad: any) => buildAdRecord(ad, effectiveConfig, videoIds));
              fetchedAds = fetchedAds.concat(processed);
              addLog(`Wrote ${processed.length} ads for Page ID: ${pageId}`, 'success');
            }
          }
        } else {
          addLog(`Fetching keyword search: "${effectiveConfig.searchTerms}"`);
          const response = await fetch('/api/meta/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: effectiveConfig,
              overrides: { maxResults: effectiveConfig.maxResults }
            })
          });

          const result = await response.json();
          if (result.error) throw new Error(result.error);

          if (result.data && result.data.length > 0) {
            const videoIds = new Set<string>();
            const processed = result.data.map((ad: any) => buildAdRecord(ad, effectiveConfig, videoIds));
            fetchedAds = processed;
            addLog(`Fetched ${processed.length} ads for query "${effectiveConfig.searchTerms}"`, 'success');
          }
        }
      } else {
        // High-fidelity simulated scrape for demonstration
        addLog(`[Demo/Simulation Mode] No Meta access token provided. Generating structured ads archive...`, 'warn');
        await new Promise(r => setTimeout(r, 600));

        if (effectiveConfig.searchType === 'page') {
          effectiveConfig.pageIds.forEach((pId, idx) => {
            addLog(`Simulating Page ID ${idx + 1}/${effectiveConfig.pageIds.length}: ${pId}`);
          });
        } else {
          addLog(`Simulating keyword query: "${effectiveConfig.searchTerms}"`);
        }

        await new Promise(r => setTimeout(r, 800));
        addLog(`Analyzing age_country_gender_reach_breakdown & calculating DSA reach totals...`);
        
        // Generate dynamic customized mock data based on input
        const brandName = effectiveConfig.searchType === 'page'
          ? (effectiveConfig.pageIds[0] === '183869772601' ? 'AG1 by Athletic Greens' : effectiveConfig.pageIds[0] === '109727962402123' ? 'Nike Running' : `Brand (Page ${effectiveConfig.pageIds[0]})`)
          : `Advertiser for "${effectiveConfig.searchTerms}"`;

        const newGeneratedAds: AdRecord[] = Array.from({ length: 6 }).map((_, i) => {
          const id = `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;
          const totalReach = Math.floor(120000 + Math.random() * 850000);
          const daysRunning = Math.floor(2 + Math.random() * 45);
          const isVideo = effectiveConfig.mediaType === 'VIDEO' ? 1 : (effectiveConfig.mediaType === 'IMAGE' ? 0 : (i % 2 === 0 ? 1 : 0));
          const mediaType: 'VIDEO' | 'IMAGE' | 'MEME' = isVideo ? 'VIDEO' : (i % 3 === 0 ? 'MEME' : 'IMAGE');

          const m1824 = Math.floor(totalReach * 0.08);
          const f1824 = Math.floor(totalReach * 0.09);
          const m2534 = Math.floor(totalReach * 0.28);
          const f2534 = Math.floor(totalReach * 0.30);
          const m3544 = Math.floor(totalReach * 0.12);
          const f3544 = Math.floor(totalReach * 0.10);

          return {
            id,
            adCreationTime: effectiveConfig.startDate,
            adDeliveryStartTime: effectiveConfig.startDate,
            adDeliveryStopTime: effectiveConfig.endDate,
            adStatus: effectiveConfig.adActiveStatus === 'INACTIVE' ? 'inactive' : 'active',
            isActive: effectiveConfig.adActiveStatus === 'INACTIVE' ? 0 : 1,
            isInactive: effectiveConfig.adActiveStatus === 'INACTIVE' ? 1 : 0,
            adCount: 1,
            pageName: brandName,
            pageId: effectiveConfig.pageIds[0] || '183869772601',
            languages: 'en, de, fr',
            creativeBody1: `Special promo: Unlock peak daily performance with our high-impact formula. Backed by 40,000+ 5-star verified reviews. Variant #${i + 1}.`,
            creativeBody2: `Stop wasting money on fragmented solutions. One daily habit delivers all essential nutrients in 60 seconds.`,
            creativeBody3: '',
            creativeBody4: '',
            creativeBody5: '',
            linkCaption1: 'official-brand.com',
            linkCaption2: '',
            linkCaption3: '',
            linkCaption4: '',
            linkCaption5: '',
            linkDescription1: 'Free worldwide express shipping and 90-day risk-free money-back guarantee.',
            linkDescription2: '',
            linkDescription3: '',
            linkDescription4: '',
            linkDescription5: '',
            linkTitle1: `Transform Your Routine | Claim Free Welcome Bundle (${i + 1})`,
            linkTitle2: 'The Daily Solution for High Performers',
            linkTitle3: '',
            linkTitle4: '',
            linkTitle5: '',
            platform1: 'FACEBOOK',
            platform2: 'INSTAGRAM',
            platform3: 'AUDIENCE_NETWORK',
            platform4: '',
            platform5: '',
            totalReach,
            snapshotUrl: `https://www.facebook.com/ads/library/?id=${id}`,
            scrapedPeriodStart: effectiveConfig.startDate,
            scrapedPeriodEnd: effectiveConfig.endDate,
            scrapedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            searchType: effectiveConfig.searchType,
            searchQuery: effectiveConfig.searchType === 'page' ? effectiveConfig.pageIds.join(', ') : effectiveConfig.searchTerms,
            daysRunning,
            avgDailyReach: Math.round(totalReach / daysRunning),
            isFreshData: i === 0 ? 1 : 0,
            isVideo,
            mediaType,
            incrementalReach: Math.round(totalReach * 0.18),
            countries: '🇬🇧 GB, 🇩🇪 DE, 🇫🇷 FR, 🇳🇱 NL, 🇪🇸 ES, 🇮🇹 IT',
            age1824Male: m1824,
            age1824Female: f1824,
            age2534Male: m2534,
            age2534Female: f2534,
            age3544Male: m3544,
            age3544Female: f3544,
            age4554Male: Math.floor(totalReach * 0.02),
            age4554Female: Math.floor(totalReach * 0.01),
            age5564Male: 0,
            age5564Female: 0,
            age65Male: 0,
            age65Female: 0,
            totalMale: m1824 + m2534 + m3544,
            totalFemale: f1824 + f2534 + f3544,
            totalAge1824: m1824 + f1824,
            totalAge2534: m2534 + f2534,
            totalAge3544: m3544 + f3544,
            totalAge4554: Math.floor(totalReach * 0.03),
            totalAge5564: 0,
            totalAge65: 0
          };
        });

        fetchedAds = newGeneratedAds;
      }

      if (fetchedAds.length === 0) {
        addLog('⚠️ No ads found for the selected period.', 'warn');
        return;
      }

      // Update datasets
      if (mode === 'one-time') {
        setOneTimeAds(fetchedAds);
        addLog(`✅ Done! Fetched ${fetchedAds.length} ads into "${SHEET_NAMES.ONE_TIME}" (previous data replaced)`, 'success');
      } else {
        setDailyAds(prev => [...fetchedAds, ...prev]);
        addLog(`✅ Done! Added ${fetchedAds.length} new rows to "${SHEET_NAMES.DAILY}"`, 'success');
      }
    } catch (err: any) {
      console.error('Scrape error:', err);
      const errMsg = err.message || String(err);
      setScrapeError(errMsg);
      addLog(`❌ Error: ${errMsg}`, 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const handleExportCsv = () => {
    const currentDataset = activeTab === 'daily' ? dailyAds : oneTimeAds;
    const name = activeTab === 'daily' ? 'Meta_Ads_Daily_Scrape.csv' : 'Meta_Ads_1Time_Scrape.csv';
    exportToCsv(currentDataset, name);
  };

  const handleCopySpreadsheet = () => {
    const currentDataset = activeTab === 'daily' ? dailyAds : oneTimeAds;
    copySpreadsheetToClipboard(currentDataset);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onScrapeOneTime={() => runScrape('one-time')}
        onScrapeDaily={() => runScrape('daily')}
        onExportCsv={handleExportCsv}
        onCopySpreadsheet={handleCopySpreadsheet}
        isScraping={isScraping}
        totalOneTimeAds={oneTimeAds.length}
        totalDailyAds={dailyAds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'setup' && (
          <SetupSheetView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onRunScrape={runScrape}
            isScraping={isScraping}
          />
        )}

        {activeTab === 'one-time' && (
          <SpreadsheetView
            sheetName={SHEET_NAMES.ONE_TIME}
            ads={oneTimeAds}
            onRefresh={() => runScrape('one-time')}
            isScraping={isScraping}
            onOpenSetup={() => setActiveTab('setup')}
            onOpenFirecrawl={() => setActiveTab('firecrawl')}
          />
        )}

        {activeTab === 'daily' && (
          <SpreadsheetView
            sheetName={SHEET_NAMES.DAILY}
            ads={dailyAds}
            onRefresh={() => runScrape('daily')}
            isScraping={isScraping}
            onOpenSetup={() => setActiveTab('setup')}
            onOpenFirecrawl={() => setActiveTab('firecrawl')}
          />
        )}

        {activeTab === 'firecrawl' && (
          <FirecrawlEmailTool
            ads={oneTimeAds.length > 0 ? oneTimeAds : dailyAds}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onUpdateAds={(updated) => {
              if (oneTimeAds.length > 0) {
                setOneTimeAds(updated);
              } else {
                setDailyAds(updated);
              }
            }}
          />
        )}

        {activeTab === 'cards' && (
          <AdCardsView ads={oneTimeAds.length > 0 ? oneTimeAds : dailyAds} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard ads={oneTimeAds.length > 0 ? oneTimeAds : dailyAds} />
        )}

        {activeTab === 'ai-insights' && (
          <AiInsightsView ads={oneTimeAds.length > 0 ? oneTimeAds : dailyAds} />
        )}

        {activeTab === 'appscript' && (
          <AppsScriptGuideView />
        )}
      </main>

      {/* Live Logger / Scrape Progress Modal */}
      <ScrapeProgressModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logs}
        isScraping={isScraping}
        error={scrapeError}
        totalAdsFetched={lastTargetSheet === SHEET_NAMES.ONE_TIME ? oneTimeAds.length : dailyAds.length}
        sheetTarget={lastTargetSheet}
        onViewSheet={() => {
          setIsLogModalOpen(false);
          setActiveTab(lastTargetSheet === SHEET_NAMES.ONE_TIME ? 'one-time' : 'daily');
        }}
      />
    </div>
  );
}
