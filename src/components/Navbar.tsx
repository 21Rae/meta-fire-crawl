import React from 'react';
import { 
  Table, 
  Settings, 
  Play, 
  RefreshCw, 
  Download, 
  Copy, 
  BarChart3, 
  Sparkles, 
  FileCode, 
  LayoutGrid,
  Check,
  Flame,
  Search,
  Zap,
  Globe2
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onScrapeOneTime: () => void;
  onScrapeDaily: () => void;
  onExportCsv: () => void;
  onCopySpreadsheet: () => void;
  isScraping: boolean;
  totalOneTimeAds: number;
  totalDailyAds: number;
  searchKeyword?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onScrapeOneTime,
  onScrapeDaily,
  onExportCsv,
  onCopySpreadsheet,
  isScraping,
  totalOneTimeAds,
  totalDailyAds,
  searchKeyword = 'protein powder'
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopySpreadsheet();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number; badge?: string }[] = [
    { id: 'setup', label: 'Search & Setup', icon: Settings },
    { id: 'one-time', label: 'Ad Archive (70-Col)', icon: Table, count: totalOneTimeAds },
    { id: 'daily', label: 'Daily Tracking', icon: RefreshCw, count: totalDailyAds },
    { id: 'cards', label: 'Creative Gallery', icon: LayoutGrid },
    { id: 'analytics', label: 'Reach & Demographics', icon: BarChart3 },
    { id: 'firecrawl', label: 'Lead & Email Hunter', icon: Flame, badge: 'Firecrawl' },
    { id: 'ai-insights', label: 'AI Copy Strategist', icon: Sparkles, badge: 'Gemini' },
    { id: 'appscript', label: 'Apps Script Engine', icon: FileCode },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 text-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Product Info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/25 border border-blue-400/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  Meta Ads Intelligence
                </span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono font-medium tracking-wide">
                  v23.0 Graph API
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Competitor Ad Library Scraper, DSA Reach Demographics & Lead Hunter
              </p>
            </div>
          </div>

          {/* Search Query Pill & Action Triggers */}
          <div className="flex items-center space-x-2.5">
            {/* Active search term indicator */}
            {searchKeyword && (
              <div 
                onClick={() => setActiveTab('setup')}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs cursor-pointer hover:border-slate-700 transition-colors"
                title="Click to edit keyword search"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Target:</span>
                <span className="font-semibold text-blue-400 max-w-[140px] truncate">"{searchKeyword}"</span>
              </div>
            )}

            {/* Scrape 1-time button */}
            <button
              id="btn-scrape-1time-nav"
              onClick={onScrapeOneTime}
              disabled={isScraping}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                isScraping
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-98 shadow-blue-900/40 border border-blue-500/50'
              }`}
              title="Runs single search scrape (replaces archive)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScraping ? 'Scraping...' : 'Scrape Ads'}</span>
            </button>

            {/* Daily Scrape */}
            <button
              id="btn-scrape-daily-nav"
              onClick={onScrapeDaily}
              disabled={isScraping}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                isScraping
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-98'
              }`}
              title="Runs time-series scrape (appends new rows)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
              <span>Track Daily</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Export Actions */}
            <button
              id="btn-export-csv"
              onClick={onExportCsv}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              title="Export 70-column CSV with all formulas"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              id="btn-copy-tsv"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              title="Copy tab-separated format to paste in Google Sheets"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Sheets Copy'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-900 pt-1.5 pb-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600/90 text-white font-semibold shadow-xs border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-900/90 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.badge && !item.count && (
                  <span className="text-[9px] uppercase tracking-wider bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-md font-semibold border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
