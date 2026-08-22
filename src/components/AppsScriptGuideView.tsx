import React, { useState } from 'react';
import { Code2, Copy, Check, Download, ExternalLink, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { APPS_SCRIPT_SOURCE } from '../utils/appScriptCode';

export const AppsScriptGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([APPS_SCRIPT_SOURCE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Meta_Ads_Scraper.gs');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
              <span>📜 Google Sheets Apps Script Integration</span>
            </h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              Tested & Verified v23.0
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Run automated scraping, scheduled daily triggers, and incremental reach tracking directly inside your native Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
            title="Download .gs file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">.gs File</span>
          </button>
        </div>
      </div>

      {/* 4-Step Setup Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
            1
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Open Google Sheets</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Create a blank Google Sheet, then click <strong>Extensions → Apps Script</strong> in the top navigation menu.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
            2
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Paste Code & Save</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Delete any starter code in the editor, paste the full script from below, and press <strong>Ctrl+S (Cmd+S)</strong> to save.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
            3
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Run "setup" Function</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Select <strong>setup</strong> in the function dropdown, click <strong>Run</strong>, and accept standard OAuth permissions.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
            4
          </div>
          <h4 className="font-bold text-slate-900 text-xs">Configure & Scrape</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Fill in your token in the new <strong>⚙️ Setup</strong> sheet, then use the <strong>📊 Meta Ads Scraper</strong> custom menu!
          </p>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-300 font-semibold ml-2">
              MetaAdsScraper.gs (Page Name, Link Caption 1, Snapshot URL, Creative Body 1)
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded border border-slate-700 font-mono"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed bg-slate-900/90">
          <code>{APPS_SCRIPT_SOURCE}</code>
        </pre>
      </div>

      {/* Common Errors & Solutions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Troubleshooting & Meta Graph API Quota Limits</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-amber-900">
          <div className="space-y-1 bg-white/80 p-3 rounded-lg border border-amber-100">
            <strong className="text-amber-950 font-bold block">1. "Reduce the amount of data" (Code: 1)</strong>
            <p className="text-amber-800 leading-relaxed">
              Meta API rejects queries requesting too many days or too many Page IDs at once. Solution: Shorten the date range to 14–30 days or scrape 1–2 competitors per batch.
            </p>
          </div>

          <div className="space-y-1 bg-white/80 p-3 rounded-lg border border-amber-100">
            <strong className="text-amber-950 font-bold block">2. Blank Reach & Demographics</strong>
            <p className="text-amber-800 leading-relaxed">
              Due to European DSA regulations, Meta exclusively publishes demographic and total reach metrics for European Union member states and the UK. Non-EU countries return blank reach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
