import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  HelpCircle, 
  Play, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Mail,
  Shield,
  RefreshCw,
  Server,
  Lock,
  Zap,
  Sliders,
  Check,
  Globe2,
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { ScraperConfig } from '../types';
import { ALL_COUNTRIES_LIST, DEFAULT_EU_COUNTRIES } from '../utils/constants';

interface SetupSheetViewProps {
  config: ScraperConfig;
  onUpdateConfig: (newConfig: Partial<ScraperConfig>) => void;
  onRunScrape: (mode: 'one-time' | 'daily') => void;
  isScraping: boolean;
}

const POPULAR_NICHES = [
  { label: '🏋️ Supplements & Fitness', query: 'whey protein creatine workout' },
  { label: '💻 SaaS & AI Software', query: 'ai marketing tool automation' },
  { label: '✨ Beauty & Skincare', query: 'anti aging serum vitamin c moisturizer' },
  { label: '👟 Footwear & Apparel', query: 'running shoes activewear gym wear' },
  { label: '💰 Fintech & Investing', query: 'crypto trading high yield savings credit card' },
  { label: '📦 DTC E-Commerce', query: 'bestseller limited edition free shipping' }
];

export const SetupSheetView: React.FC<SetupSheetViewProps> = ({
  config,
  onUpdateConfig,
  onRunScrape,
  isScraping
}) => {
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  
  // Environment status from server
  const [envStatus, setEnvStatus] = useState<{
    hasMetaToken: boolean;
    hasFirecrawlKey: boolean;
    hasGeminiKey: boolean;
    isLoading: boolean;
  }>({
    hasMetaToken: false,
    hasFirecrawlKey: false,
    hasGeminiKey: false,
    isLoading: true
  });

  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  const [isTestingFirecrawl, setIsTestingFirecrawl] = useState(false);
  const [firecrawlTestResult, setFirecrawlTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  const checkEnvStatus = async () => {
    try {
      setEnvStatus(prev => ({ ...prev, isLoading: true }));
      const res = await fetch('/api/config/status');
      if (res.ok) {
        const data = await res.json();
        setEnvStatus({
          hasMetaToken: Boolean(data.hasMetaToken),
          hasFirecrawlKey: Boolean(data.hasFirecrawlKey),
          hasGeminiKey: Boolean(data.hasGeminiKey),
          isLoading: false
        });
      }
    } catch {
      setEnvStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkEnvStatus();
  }, []);

  const handleTestToken = async () => {
    setIsTestingToken(true);
    setTokenTestResult(null);
    try {
      const res = await fetch('/api/meta/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setTokenTestResult(data);
      if (data.valid) {
        checkEnvStatus();
      }
    } catch (err: any) {
      setTokenTestResult({ valid: false, message: err.message || 'Network test failed' });
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleTestFirecrawl = async () => {
    setIsTestingFirecrawl(true);
    setFirecrawlTestResult(null);
    try {
      const res = await fetch('/api/firecrawl/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setFirecrawlTestResult(data);
      if (data.valid) {
        checkEnvStatus();
      }
    } catch (err: any) {
      setFirecrawlTestResult({ valid: false, message: err.message || 'Firecrawl connection test failed' });
    } finally {
      setIsTestingFirecrawl(false);
    }
  };

  const handleToggleCountry = (code: string) => {
    const exists = config.countries.includes(code);
    const updated = exists 
      ? config.countries.filter(c => c !== code)
      : [...config.countries, code];
    onUpdateConfig({ countries: updated });
  };

  const handleSelectAllEU = () => {
    onUpdateConfig({ countries: DEFAULT_EU_COUNTRIES });
  };

  const handleClearCountries = () => {
    onUpdateConfig({ countries: [] });
  };

  const handleTogglePlatform = (platform: string) => {
    const exists = config.publisherPlatforms.includes(platform);
    const updated = exists
      ? config.publisherPlatforms.filter(p => p !== platform)
      : [...config.publisherPlatforms, platform];
    onUpdateConfig({ publisherPlatforms: updated });
  };

  const selectNiche = (query: string) => {
    onUpdateConfig({ 
      searchTerms: query,
      searchType: 'keyword'
    });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. HERO COMMAND STUDIO */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Meta Ads Library Intelligence Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Search, Scrape & Analyze Competitor Meta Ads
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Query millions of live and historical Facebook & Instagram ad creatives by keyword. Extract structured 70-column spreadsheet rows with DSA demographic breakdowns and auto-extract advertiser destination emails.
          </p>
        </div>

        {/* Search Bar Input Group */}
        <div className="mt-6 sm:mt-8 relative z-10 space-y-4">
          <div className="bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                id="input-search-terms-hero"
                type="text"
                value={config.searchTerms}
                onChange={e => onUpdateConfig({ searchTerms: e.target.value, searchType: 'keyword' })}
                placeholder="Enter keywords or brand terms (e.g., protein powder, CRM software, activewear)..."
                className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') onRunScrape('one-time');
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="select-keyword-match-hero"
                value={config.keywordSearchType}
                onChange={e => onUpdateConfig({ keywordSearchType: e.target.value as any })}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="KEYWORD_UNORDERED">Unordered Keywords (Broad)</option>
                <option value="KEYWORD_EXACT_PHRASE">Exact Phrase Match</option>
              </select>

              <button
                id="btn-scrape-hero"
                onClick={() => onRunScrape('one-time')}
                disabled={isScraping}
                className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg transition-all whitespace-nowrap ${
                  isScraping
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-98 shadow-blue-500/25 border border-blue-400/40'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isScraping ? 'Scraping...' : 'Search Ads'}</span>
              </button>
            </div>
          </div>

          {/* Quick niche selection chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Popular Niches:
            </span>
            {POPULAR_NICHES.map(niche => (
              <button
                key={niche.label}
                onClick={() => selectNiche(niche.query)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  config.searchTerms === niche.query
                    ? 'bg-blue-600/30 text-blue-200 border-blue-400/40 font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                }`}
              >
                {niche.label}
              </button>
            ))}
          </div>

          {saveSuccessNotice && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-2 w-fit">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Keyword updated! Click "Search Ads" to fetch live data.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. CONFIGURATION & EXECUTION CONTROL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Search Filters & Parameters */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. TIME HORIZON & VOLUME */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Time Horizon & Volume Cap</h2>
                  <p className="text-xs text-slate-500">Define scrape date bounds and maximum result payloads</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                {config.startDate} → {config.endDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Range Horizon
                </label>
                <select
                  id="select-time-period"
                  value={config.timePeriod}
                  onChange={e => onUpdateConfig({ timePeriod: e.target.value })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="last_7_days">Last 7 Days (Fastest & Fresh)</option>
                  <option value="last_14_days">Last 14 Days</option>
                  <option value="last_30_days">Last 30 Days (Recommended)</option>
                  <option value="last_90_days">Last 90 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Max Ads Limit Cap ({config.maxResults} Ads)
                </label>
                <div className="flex items-center space-x-2">
                  {[100, 500, 1000, 3000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateConfig({ maxResults: val })}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        config.maxResults === val
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {config.timePeriod === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={e => onUpdateConfig({ startDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={e => onUpdateConfig({ endDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* B. CREATIVE & PLATFORM FILTERS */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Creative & Delivery Filters</h2>
                  <p className="text-xs text-slate-500">Filter media types, active delivery status and publisher channels</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Media Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Creative Media Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: 'All Media' },
                    { id: 'VIDEO', label: 'Videos Only' },
                    { id: 'IMAGE', label: 'Images Only' },
                    { id: 'MEME', label: 'Memes / Text' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateConfig({ mediaType: m.id as any })}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                        config.mediaType === m.id
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Active Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ad Delivery Status
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'ALL', label: 'All Ads (Active + Inactive Archives)' },
                    { id: 'ACTIVE', label: 'Currently Active Ads Only' },
                    { id: 'INACTIVE', label: 'Inactive / Concluded Ads Only' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onUpdateConfig({ adActiveStatus: s.id as any })}
                      className={`w-full py-1.5 px-3 rounded-lg border text-xs text-left font-medium transition-all flex items-center justify-between ${
                        config.adActiveStatus === s.id
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{s.label}</span>
                      {config.adActiveStatus === s.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Publisher Platforms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Publisher Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {['FACEBOOK', 'INSTAGRAM', 'AUDIENCE_NETWORK', 'MESSENGER', 'THREADS'].map(platform => {
                  const isSelected = config.publisherPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleTogglePlatform(platform)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DSA Country Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    DSA Demographic Regions ({config.countries.length} Selected)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Meta Graph API delivers demographic breakdowns for EU member states and the UK under DSA regulations.
                  </p>
                </div>
                <div className="flex space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllEU}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    Select All EU (27)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearCountries}
                    className="text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {ALL_COUNTRIES_LIST.map(country => {
                  const isSelected = config.countries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleToggleCountry(country.code)}
                      className={`text-xs px-2 py-1 rounded-md border flex items-center space-x-1 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Launch Action Box & Secrets Health */}
        <div className="lg:col-span-4 space-y-6">
          {/* LAUNCH EXECUTION HUB */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl shadow-xl p-6 border border-slate-800 space-y-5">
            <div>
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold tracking-wider uppercase">
                <Zap className="w-4 h-4" />
                <span>Execution Hub</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                Run Scrape Pipeline
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Fetches ad creatives, builds 70-column structured records, and stores data in your active session.
              </p>
            </div>

            {/* Quick parameter breakdown */}
            <div className="bg-slate-800/80 rounded-xl p-3.5 space-y-2 border border-slate-700/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Query:</span>
                <span className="font-semibold text-blue-300 font-mono">"{config.searchTerms || 'protein powder'}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Match Mode:</span>
                <span className="text-slate-200">{config.keywordSearchType === 'KEYWORD_EXACT_PHRASE' ? 'Exact Phrase' : 'Broad Match'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Media Scope:</span>
                <span className="text-slate-200 font-medium">{config.mediaType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Payload:</span>
                <span className="text-slate-200 font-mono">{config.maxResults} Ads</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                id="btn-scrape-1time-main"
                onClick={() => onRunScrape('one-time')}
                disabled={isScraping}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all ${
                  isScraping
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-98 shadow-blue-900/50 border border-blue-400/40'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isScraping ? 'Scraping in progress...' : '⚡ Scrape Meta Ads (Archive Mode)'}</span>
              </button>

              <button
                id="btn-scrape-daily-main"
                onClick={() => onRunScrape('daily')}
                disabled={isScraping}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
                  isScraping
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-98'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>🔄 Track Daily (Append Mode)</span>
              </button>
            </div>
          </div>

          {/* DEVELOPER SECRETS & INTEGRATION HEALTH */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>API & Secrets Status</span>
              </div>
              <button
                onClick={checkEnvStatus}
                disabled={envStatus.isLoading}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${envStatus.isLoading ? 'animate-spin' : ''}`} />
                <span>Check</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Meta Token Status */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-800">META_ACCESS_TOKEN</span>
                    <span className={`w-2 h-2 rounded-full ${envStatus.hasMetaToken ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {envStatus.hasMetaToken ? 'Live Graph API connected' : 'Simulated fallback active'}
                  </p>
                </div>
                <button
                  onClick={handleTestToken}
                  disabled={isTestingToken}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  {isTestingToken ? 'Testing...' : 'Test'}
                </button>
              </div>

              {tokenTestResult && (
                <div className={`p-2 rounded text-[11px] border ${
                  tokenTestResult.valid 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {tokenTestResult.message}
                </div>
              )}

              {/* Firecrawl Key Status */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-800">FIRECRAWL_API_KEY</span>
                    <span className={`w-2 h-2 rounded-full ${envStatus.hasFirecrawlKey ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {envStatus.hasFirecrawlKey ? 'Email scraper ready' : 'Add key to scrape live URLs'}
                  </p>
                </div>
                <button
                  onClick={handleTestFirecrawl}
                  disabled={isTestingFirecrawl}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  {isTestingFirecrawl ? 'Testing...' : 'Test'}
                </button>
              </div>

              {/* Gemini AI Key Status */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-800">GEMINI_API_KEY</span>
                    <span className={`w-2 h-2 rounded-full ${envStatus.hasGeminiKey ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {envStatus.hasGeminiKey ? 'AI Strategist connected' : 'Fallback heuristics active'}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Auto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
