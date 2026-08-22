import React from 'react';
import { 
  Table, 
  Settings, 
  Play, 
  RefreshCw, 
  Download, 
  Copy, 
  BarChart2, 
  Sparkles, 
  Code2, 
  Grid,
  Check,
  Flame
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
  totalDailyAds
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopySpreadsheet();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number }[] = [
    { id: 'setup', label: '⚙️ Setup', icon: Settings },
    { id: 'one-time', label: '⚡ Scrape 1-time', icon: Table, count: totalOneTimeAds },
    { id: 'daily', label: '🔄 Scrape Daily', icon: RefreshCw, count: totalDailyAds },
    { id: 'firecrawl', label: '🔥 Firecrawl Emails', icon: Flame },
    { id: 'cards', label: '🖼️ Ad Creatives', icon: Grid },
    { id: 'analytics', label: '📊 Demographics & Reach', icon: BarChart2 },
    { id: 'ai-insights', label: '🤖 AI Copy Strategist', icon: Sparkles },
    { id: 'appscript', label: '📜 Apps Script Code', icon: Code2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="font-bold text-lg text-white">M</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Meta Ads Library Scraper
                </h1>
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-mono">
                  v23.0 Graph API
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Google Sheets Automation & Demographics Analyzer
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-scrape-1time-nav"
              onClick={onScrapeOneTime}
              disabled={isScraping}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all ${
                isScraping
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-900/30'
              }`}
              title="Runs fresh scrape (replaces sheet rows)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScraping ? 'Scraping...' : '⚡ Scrape 1-time'}</span>
            </button>

            <button
              id="btn-scrape-daily-nav"
              onClick={onScrapeDaily}
              disabled={isScraping}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all ${
                isScraping
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 shadow-indigo-900/30'
              }`}
              title="Runs daily scrape (appends new rows)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">🔄 Scrape Daily</span>
              <span className="md:hidden">Daily</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            <button
              id="btn-export-csv"
              onClick={onExportCsv}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Download CSV formatted with all 70 columns and formulas"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Export CSV</span>
            </button>

            <button
              id="btn-copy-tsv"
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copy tab-separated values to paste directly into Google Sheets"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{copied ? 'Copied!' : 'Copy to Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1 pb-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.count}
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
