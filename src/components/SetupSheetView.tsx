import React, { useState } from 'react';
import { 
  Key, 
  Search, 
  Calendar, 
  Filter, 
  HelpCircle, 
  Play, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Plus,
  X,
  Sparkles,
  Info,
  CheckCircle2,
  Flame,
  Mail,
  Shield
} from 'lucide-react';
import { ScraperConfig } from '../types';
import { ALL_COUNTRIES_LIST, DEFAULT_EU_COUNTRIES } from '../utils/constants';

interface SetupSheetViewProps {
  config: ScraperConfig;
  onUpdateConfig: (newConfig: Partial<ScraperConfig>) => void;
  onRunScrape: (mode: 'one-time' | 'daily') => void;
  isScraping: boolean;
}

export const SetupSheetView: React.FC<SetupSheetViewProps> = ({
  config,
  onUpdateConfig,
  onRunScrape,
  isScraping
}) => {
  const [showToken, setShowToken] = useState(false);
  const [newPageIdInput, setNewPageIdInput] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleAddPageId = () => {
    if (!newPageIdInput.trim()) return;
    const ids = newPageIdInput.split(',').map(id => id.trim()).filter(Boolean);
    const updated = Array.from(new Set([...config.pageIds, ...ids]));
    onUpdateConfig({ pageIds: updated });
    setNewPageIdInput('');
  };

  const handleRemovePageId = (idToRemove: string) => {
    onUpdateConfig({
      pageIds: config.pageIds.filter(id => id !== idToRemove)
    });
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

  const loadPreset = (brand: 'athletic-greens' | 'nike' | 'gymshark' | 'fintech' | 'keyword-demo') => {
    if (brand === 'athletic-greens') {
      onUpdateConfig({
        searchType: 'page',
        pageIds: ['183869772601'],
        timePeriod: 'last_30_days',
        mediaType: 'ALL',
        adActiveStatus: 'ALL'
      });
    } else if (brand === 'nike') {
      onUpdateConfig({
        searchType: 'page',
        pageIds: ['109727962402123'],
        timePeriod: 'last_30_days',
        mediaType: 'VIDEO',
        adActiveStatus: 'ACTIVE'
      });
    } else if (brand === 'gymshark') {
      onUpdateConfig({
        searchType: 'page',
        pageIds: ['401928371092837'],
        timePeriod: 'last_14_days',
        mediaType: 'ALL',
        adActiveStatus: 'ALL'
      });
    } else if (brand === 'fintech') {
      onUpdateConfig({
        searchType: 'page',
        pageIds: ['591827364019283', '291827364501928'],
        timePeriod: 'last_30_days',
        mediaType: 'ALL',
        adActiveStatus: 'ALL'
      });
    } else {
      onUpdateConfig({
        searchType: 'keyword',
        searchTerms: 'protein powder whey creatine',
        keywordSearchType: 'KEYWORD_UNORDERED',
        timePeriod: 'last_30_days',
        mediaType: 'ALL',
        adActiveStatus: 'ACTIVE'
      });
    }
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Title Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                ⚙️ META ADS LIBRARY SCRAPER SETUP
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                Sheet Configuration
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Configure your Meta Graph API parameters, targeting parameters, time horizons, and competitor Page IDs.
            </p>
            <div className="mt-2 flex items-center space-x-2 text-xs">
              <a
                href="https://www.facebook.com/ads/library/api/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center font-medium"
              >
                <span>▶ Official Meta Ad Library API Documentation</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">
                Note: Reach and demographic breakdown data requires EU & UK regions under DSA rules
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-indigo-500" /> Presets:
            </span>
            <button
              onClick={() => loadPreset('athletic-greens')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded border border-slate-200 shadow-2xs"
            >
              AG1 (183869772601)
            </button>
            <button
              onClick={() => loadPreset('nike')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded border border-slate-200 shadow-2xs"
            >
              Nike Running
            </button>
            <button
              onClick={() => loadPreset('gymshark')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded border border-slate-200 shadow-2xs"
            >
              Gymshark
            </button>
            <button
              onClick={() => loadPreset('keyword-demo')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-2 py-1 rounded border border-slate-200 shadow-2xs"
            >
              Keyword Search
            </button>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-3 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preset parameters updated successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. AUTHENTICATION SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-red-50/80 border-b border-red-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-900 font-bold text-sm">
                <Key className="w-4 h-4 text-red-600" />
                <span>🔐 AUTHENTICATION</span>
              </div>
              <span className="text-xs text-red-700 font-medium">Required for Live Scraping</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Meta Access Token
                </label>
                <div className="relative">
                  <input
                    id="input-meta-access-token"
                    type={showToken ? 'text' : 'password'}
                    value={config.accessToken}
                    onChange={e => onUpdateConfig({ accessToken: e.target.value.trim() })}
                    placeholder="EAABwzLIX45... (or leave empty to test with rich simulated datasets)"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pr-24 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    {config.accessToken && (
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ accessToken: '' })}
                        className="px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium"
                        title="Clear token to use simulated demo mode"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-1">
                  <span>
                    Get a fresh token from{' '}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Meta Graph API Explorer ↗
                    </a>
                  </span>
                  {config.accessToken ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-600 font-medium flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Live Token Configured
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚡ Demo / Simulation Mode Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FIRECRAWL EMAIL EXTRACTOR CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-amber-50/80 border-b border-amber-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>🔥 FIRECRAWL EMAIL EXTRACTOR</span>
              </div>
              <span className="text-xs text-amber-700 font-medium">Extracts Leads from Link Caption 1</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Firecrawl API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="input-firecrawl-api-key"
                    type="password"
                    value={config.firecrawlApiKey || ''}
                    onChange={e => onUpdateConfig({ firecrawlApiKey: e.target.value })}
                    placeholder="fc_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {config.firecrawlApiKey && (
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ firecrawlApiKey: '' })}
                      className="px-2.5 py-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                      title="Clear Firecrawl API key"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="flex items-center">
                    Get an API key at{' '}
                    <a
                      href="https://firecrawl.dev"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 hover:underline font-medium ml-1 flex items-center"
                    >
                      <span>firecrawl.dev</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </span>
                  {config.firecrawlApiKey ? (
                    <span className="text-emerald-600 font-medium flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Firecrawl Key Configured
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">
                      (Optional: Leave empty for simulated contact discovery)
                    </span>
                  )}
                </div>
              </div>

              {/* Auto-drop Social & App Store Links switch */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auto-drop Social & App Store Links</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Skips Facebook, Instagram, Google Play Store, and Apple App Store URLs (e.g. <code className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-mono text-[10px]">play.google.com</code>, <code className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-mono text-[10px]">apps.apple.com</code>, <code className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-mono text-[10px]">fb.me</code>) to conserve your Firecrawl tokens for real target lead websites.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                  <input
                    type="checkbox"
                    checked={config.autoDropSocialLinks !== false}
                    onChange={e => onUpdateConfig({ autoDropSocialLinks: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 2. SEARCH SETTINGS SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>🎯 SEARCH SETTINGS</span>
              </div>
              <span className="text-xs text-emerald-700 font-medium">Page ID vs Keyword Mode</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Search Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Search Type
                  </label>
                  <select
                    id="select-search-type"
                    value={config.searchType}
                    onChange={e => onUpdateConfig({ searchType: e.target.value as 'page' | 'keyword' })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="page">Page (By Facebook Page ID)</option>
                    <option value="keyword">Keyword (By Search Terms)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {config.searchType === 'page' 
                      ? 'Scrapes exact competitor company Page IDs' 
                      : 'Scrapes all ads containing specific keywords'}
                  </p>
                </div>

                {config.searchType === 'keyword' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Keyword Match Type
                    </label>
                    <select
                      id="select-keyword-match"
                      value={config.keywordSearchType}
                      onChange={e => onUpdateConfig({ keywordSearchType: e.target.value as any })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="KEYWORD_UNORDERED">KEYWORD_UNORDERED (Any word order)</option>
                      <option value="KEYWORD_EXACT_PHRASE">KEYWORD_EXACT_PHRASE (Exact string only)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Page IDs or Keywords */}
              {config.searchType === 'page' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Competitor Page IDs (Comma-separated)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="input-page-ids"
                      type="text"
                      value={newPageIdInput}
                      onChange={e => setNewPageIdInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPageId(); } }}
                      placeholder="e.g. 183869772601, 109727962402123"
                      className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPageId}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Active Page ID Tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {config.pageIds.map(id => (
                      <span
                        key={id}
                        className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-mono"
                      >
                        <span>ID: {id}</span>
                        <button
                          onClick={() => handleRemovePageId(id)}
                          className="text-emerald-500 hover:text-emerald-800 ml-1 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {config.pageIds.length === 0 && (
                      <span className="text-xs text-amber-600 italic">No Page IDs added yet. Enter an ID above.</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Find on Facebook Page → About → Page Transparency → Page ID.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Search Query Terms
                  </label>
                  <input
                    id="input-search-terms"
                    type="text"
                    value={config.searchTerms}
                    onChange={e => onUpdateConfig({ searchTerms: e.target.value })}
                    placeholder='e.g. "protein powder", "running shoe", "crm software"'
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter terms to search all advertisers in the Facebook Ads Library archive.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. TIME RANGE SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>📅 TIME RANGE</span>
              </div>
              <span className="text-xs text-blue-700 font-medium">Ad Delivery Window</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Time Period
                  </label>
                  <select
                    id="select-time-period"
                    value={config.timePeriod}
                    onChange={e => onUpdateConfig({ timePeriod: e.target.value })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">Custom (Manual Dates)</option>
                    <option value="today">Today (Yesterday PT)</option>
                    <option value="last_day">Last 1 Day</option>
                    <option value="last_3_days">Last 3 Days</option>
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_14_days">Last 14 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="last_6_months">Last 6 Months</option>
                    <option value="last_year">Last 1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date (YYYY-MM-DD)
                  </label>
                  <input
                    id="input-start-date"
                    type="date"
                    value={config.startDate}
                    onChange={e => onUpdateConfig({ startDate: e.target.value, timePeriod: 'custom' })}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date (YYYY-MM-DD)
                  </label>
                  <input
                    id="input-end-date"
                    type="date"
                    value={config.endDate}
                    onChange={e => onUpdateConfig({ endDate: e.target.value, timePeriod: 'custom' })}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. FILTERS SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-50/80 border-b border-purple-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm">
                <Filter className="w-4 h-4 text-purple-600" />
                <span>⚙️ FILTERS & TARGETING</span>
              </div>
              <span className="text-xs text-purple-700 font-medium">Platforms & Media Formats</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Media Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Media Type
                  </label>
                  <select
                    id="select-media-type"
                    value={config.mediaType}
                    onChange={e => onUpdateConfig({ mediaType: e.target.value as any })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">ALL (Images, Videos, Memes)</option>
                    <option value="IMAGE">IMAGE (Static without text)</option>
                    <option value="VIDEO">VIDEO (Video creatives)</option>
                    <option value="MEME">MEME (Images with text overlay)</option>
                  </select>
                </div>

                {/* Ad Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ad Status
                  </label>
                  <select
                    id="select-ad-status"
                    value={config.adActiveStatus}
                    onChange={e => onUpdateConfig({ adActiveStatus: e.target.value as any })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">ALL (Active + Inactive)</option>
                    <option value="ACTIVE">ACTIVE (Running right now)</option>
                    <option value="INACTIVE">INACTIVE (Stopped campaigns)</option>
                  </select>
                </div>

                {/* Max Results */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Results Limit
                  </label>
                  <select
                    id="select-max-results"
                    value={config.maxResults}
                    onChange={e => onUpdateConfig({ maxResults: Number(e.target.value) })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="100">100 Ads (Fast sample)</option>
                    <option value="500">500 Ads (Standard)</option>
                    <option value="1000">1,000 Ads (Recommended)</option>
                    <option value="3000">3,000 Ads (Deep dive)</option>
                    <option value="5000">5,000 Ads (Max ceiling)</option>
                  </select>
                </div>
              </div>

              {/* Publisher Platforms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Publisher Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {['FACEBOOK', 'INSTAGRAM', 'AUDIENCE_NETWORK', 'MESSENGER', 'THREADS'].map(plat => {
                    const isChecked = config.publisherPlatforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => handleTogglePlatform(plat)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          isChecked
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Countries Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Countries ({config.countries.length} selected)
                  </label>
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllEU}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Select 26 EU + UK
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearCountries}
                      className="text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
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
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Due to the European Digital Services Act (DSA), Meta only makes detailed reach & demographic breakdown publicly available for European Union member states and the UK.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Quick Help */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Trigger Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-lg p-5 border border-slate-700">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Launch Scraper</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Choose your execution mode. All results will be structured into the 70-column format.
            </p>

            <div className="mt-4 space-y-3">
              <button
                id="btn-scrape-1time-main"
                onClick={() => onRunScrape('one-time')}
                disabled={isScraping}
                className={`w-full py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all ${
                  isScraping
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-98 shadow-emerald-900/40'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>⚡ Scrape 1-time (Replaces Data)</span>
              </button>

              <button
                id="btn-scrape-daily-main"
                onClick={() => onRunScrape('daily')}
                disabled={isScraping}
                className={`w-full py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all ${
                  isScraping
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 shadow-indigo-900/40'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>🔄 Scrape Daily (Appends Rows)</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Active Mode:</span>
                <span className="text-slate-200 font-mono capitalize">{config.searchType} Search</span>
              </div>
              <div className="flex justify-between">
                <span>Date Horizon:</span>
                <span className="text-slate-200 font-mono">{config.startDate} to {config.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Ad Batch:</span>
                <span className="text-slate-200 font-mono">{config.maxResults} Ads</span>
              </div>
            </div>
          </div>

          {/* 💡 QUICK HELP CARD (Matching Apps Script Sheet notes) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>💡 QUICK HELP & SAFE LIMITS</span>
            </div>

            <ul className="text-xs text-slate-600 space-y-2.5 pl-1">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>
                  <strong>Safe Zone:</strong> For one-time scrapes with multiple Page IDs, scrape max 2 weeks to 1 month. Meta API limits payload sizes. (~1,000 ads / Page ID = ~3,000 rows safe zone).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>
                  <strong>Search Type = "page"</strong> uses Page ID only (Search Terms are ignored).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>
                  <strong>Search Type = "keyword"</strong> uses Search Terms (Page ID is ignored).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>
                  <strong>⚡ Scrape 1-time:</strong> Fetches ads → replaces all rows each run. Best for single-point competitor deep dives.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>
                  <strong>🔄 Scrape Daily:</strong> Fetches ads → appends new rows (never overwrites). Best for automated time-series tracking.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
