import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Download, 
  Play, 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Zap,
  Globe,
  Sliders
} from 'lucide-react';
import { AdRecord, ScraperConfig, ExtractedEmailResult } from '../types';

interface FirecrawlEmailToolProps {
  ads: AdRecord[];
  config: ScraperConfig;
  onUpdateConfig: (newConfig: Partial<ScraperConfig>) => void;
  onUpdateAds: (updatedAds: AdRecord[]) => void;
}

export const FirecrawlEmailTool: React.FC<FirecrawlEmailToolProps> = ({
  ads,
  config,
  onUpdateConfig,
  onUpdateAds
}) => {
  const [apiKey, setApiKey] = useState(config.firecrawlApiKey || '');
  const [prompt, setPrompt] = useState('extract all emails');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ valid: boolean; message: string } | null>(null);
  
  const [extractedMap, setExtractedMap] = useState<Record<string, ExtractedEmailResult>>(() => {
    const initial: Record<string, ExtractedEmailResult> = {};
    ads.forEach(ad => {
      const link = (ad.linkCaption1 || '').trim();
      if (link && ad.extractedEmails && ad.extractedEmails.length > 0) {
        initial[link] = {
          url: link.startsWith('http') ? link : `https://${link}`,
          originalLink: link,
          pageName: ad.pageName,
          adId: ad.id,
          status: 'completed',
          emails: ad.extractedEmails,
          source: 'firecrawl'
        };
      }
    });
    return initial;
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentUrl: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'has_emails' | 'no_emails'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showConfig, setShowConfig] = useState(!config.firecrawlApiKey);

  // Extract unique links from Link Caption 1
  const uniqueLinksData = useMemo(() => {
    const map = new Map<string, { link: string; pageName: string; adIds: string[]; creativeBody: string; snapshotUrl: string }>();
    
    ads.forEach(ad => {
      const link = (ad.linkCaption1 || '').trim();
      if (link) {
        if (!map.has(link)) {
          map.set(link, {
            link,
            pageName: ad.pageName,
            adIds: [ad.id],
            creativeBody: ad.creativeBody1,
            snapshotUrl: ad.snapshotUrl
          });
        } else {
          map.get(link)!.adIds.push(ad.id);
        }
      }
    });

    return Array.from(map.values());
  }, [ads]);

  // Test Firecrawl API Key
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setKeyTestStatus({ valid: false, message: 'Please enter a Firecrawl API key' });
      return;
    }

    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch('/api/firecrawl/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      const data = await res.json();
      setKeyTestStatus({
        valid: data.valid,
        message: data.message || (data.valid ? 'API Key is active!' : 'Invalid API Key')
      });
      if (data.valid) {
        onUpdateConfig({ firecrawlApiKey: apiKey.trim() });
      }
    } catch (err: any) {
      setKeyTestStatus({ valid: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Save Firecrawl API Key
  const handleSaveApiKey = () => {
    onUpdateConfig({ firecrawlApiKey: apiKey.trim() });
    setKeyTestStatus({ valid: true, message: 'Saved successfully!' });
  };

  // Run extraction for a single URL
  const extractSingleUrl = async (link: string, pageName?: string): Promise<ExtractedEmailResult> => {
    try {
      const res = await fetch('/api/firecrawl/extract-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: link,
          firecrawlApiKey: apiKey.trim() || config.firecrawlApiKey,
          prompt
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const result = data.data?.[0] || {
        url: link,
        originalLink: link,
        status: 'failed',
        emails: [],
        error: 'No result returned'
      };

      return {
        ...result,
        pageName: pageName || '',
        timestamp: new Date().toLocaleTimeString()
      };
    } catch (err: any) {
      return {
        url: link,
        originalLink: link,
        pageName: pageName || '',
        status: 'failed',
        emails: [],
        error: err.message || 'Failed to extract emails'
      };
    }
  };

  // Extract batch
  const handleExtractBatch = async (onlyMissing = false) => {
    const targets = uniqueLinksData.filter(item => {
      if (onlyMissing) {
        const existing = extractedMap[item.link];
        return !existing || existing.emails.length === 0;
      }
      return true;
    });

    if (targets.length === 0) return;

    setIsExtracting(true);
    setProgress({ current: 0, total: targets.length, currentUrl: targets[0].link });

    const newExtracted = { ...extractedMap };
    let updatedAds = [...ads];

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      setProgress({ current: i + 1, total: targets.length, currentUrl: item.link });

      // Mark scraping
      newExtracted[item.link] = {
        url: item.link,
        originalLink: item.link,
        pageName: item.pageName,
        status: 'scraping',
        emails: newExtracted[item.link]?.emails || []
      };
      setExtractedMap({ ...newExtracted });

      const result = await extractSingleUrl(item.link, item.pageName);
      newExtracted[item.link] = result;
      setExtractedMap({ ...newExtracted });

      // Persist to matching ads in the spreadsheet dataset
      if (result.emails.length > 0) {
        updatedAds = updatedAds.map(ad => {
          if ((ad.linkCaption1 || '').trim() === item.link) {
            return { ...ad, extractedEmails: result.emails };
          }
          return ad;
        });
      }
    }

    onUpdateAds(updatedAds);
    setIsExtracting(false);
  };

  // Extract one URL specifically
  const handleExtractOne = async (item: { link: string; pageName: string }) => {
    setExtractedMap(prev => ({
      ...prev,
      [item.link]: {
        url: item.link,
        originalLink: item.link,
        pageName: item.pageName,
        status: 'scraping',
        emails: prev[item.link]?.emails || []
      }
    }));

    const result = await extractSingleUrl(item.link, item.pageName);
    
    setExtractedMap(prev => ({
      ...prev,
      [item.link]: result
    }));

    // Update ads array
    if (result.emails.length > 0) {
      const updated = ads.map(ad => {
        if ((ad.linkCaption1 || '').trim() === item.link) {
          return { ...ad, extractedEmails: result.emails };
        }
        return ad;
      });
      onUpdateAds(updated);
    }
  };

  // Copy email
  const handleCopySingleEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Copy all extracted emails
  const handleCopyAllEmails = () => {
    const allEmails = new Set<string>();
    (Object.values(extractedMap) as ExtractedEmailResult[]).forEach(res => {
      res.emails?.forEach(e => allEmails.add(e));
    });
    const emailList = Array.from(allEmails).join('\n');
    navigator.clipboard.writeText(emailList);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export CSV with extracted emails
  const handleExportCsvWithEmails = () => {
    const rows = ads.map(ad => {
      const link = (ad.linkCaption1 || '').trim();
      const emails = extractedMap[link]?.emails?.join('; ') || (ad.extractedEmails?.join('; ') || '');
      
      const escape = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        escape(ad.pageName),
        escape(ad.linkCaption1),
        escape(emails),
        escape(ad.snapshotUrl),
        escape(ad.creativeBody1)
      ].join(',');
    });

    const headerRow = ['"Page Name"', '"Link Caption 1"', '"Extracted Emails"', '"Snapshot URL"', '"Creative Body 1"'].join(',');
    const csvContent = [headerRow, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meta_ads_firecrawl_emails_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for the UI table
  const filteredLinks = useMemo(() => {
    return uniqueLinksData.filter(item => {
      const extracted = extractedMap[item.link];
      const emails = extracted?.emails || [];

      if (filterMode === 'has_emails' && emails.length === 0) return false;
      if (filterMode === 'no_emails' && emails.length > 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchLink = item.link.toLowerCase().includes(q);
        const matchPage = item.pageName.toLowerCase().includes(q);
        const matchEmails = emails.some(e => e.toLowerCase().includes(q));
        return matchLink || matchPage || matchEmails;
      }
      return true;
    });
  }, [uniqueLinksData, extractedMap, filterMode, searchQuery]);

  // Statistics
  const totalEmailsFound = useMemo(() => {
    const set = new Set<string>();
    (Object.values(extractedMap) as ExtractedEmailResult[]).forEach(res => res.emails?.forEach(e => set.add(e)));
    return set.size;
  }, [extractedMap]);

  const linksWithEmailsCount = useMemo(() => {
    return uniqueLinksData.filter(item => (extractedMap[item.link]?.emails?.length || 0) > 0).length;
  }, [uniqueLinksData, extractedMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 rounded-xl p-6 text-white shadow-lg shadow-orange-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Flame className="w-6 h-6 text-white fill-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Firecrawl Email Extractor</h2>
              <p className="text-xs text-orange-100">
                Picks destination links from <span className="font-semibold underline">Link Caption 1</span> and extracts contact & support emails using Firecrawl.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold backdrop-blur transition-colors border border-white/20"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide API Config' : 'Configure Firecrawl Key'}</span>
          </button>
          
          <button
            onClick={handleCopyAllEmails}
            disabled={totalEmailsFound === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-orange-900 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold shadow transition-all"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-orange-600" />}
            <span>{copiedAll ? 'Copied All!' : `Copy ${totalEmailsFound} Emails`}</span>
          </button>

          <button
            onClick={handleExportCsvWithEmails}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-orange-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow transition-all border border-orange-800"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* API Configuration Card */}
      {showConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm">Firecrawl API Credentials & Options</h3>
            </div>
            <a
              href="https://firecrawl.dev"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>Get Firecrawl API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Firecrawl API Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="fc_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !apiKey.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {isTestingKey ? 'Verifying...' : 'Test Key'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
              {keyTestStatus && (
                <div className={`mt-1.5 text-xs flex items-center space-x-1.5 ${keyTestStatus.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {keyTestStatus.valid ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{keyTestStatus.message}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Extraction Prompt (n8n JSON flow)
              </label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="extract all emails"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 block">
                Default: <code className="text-amber-300">extract all emails</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics & Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Unique Links</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{uniqueLinksData.length}</div>
            <span className="text-[11px] text-slate-500">From Link Caption 1 column</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <LinkIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Domains Scraped</span>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{linksWithEmailsCount} / {uniqueLinksData.length}</div>
            <span className="text-[11px] text-emerald-600">Domains with emails found</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Emails Extracted</span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{totalEmailsFound}</div>
            <span className="text-[11px] text-amber-600">Ready for outreach & export</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Mail className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar (when active) */}
      {isExtracting && (
        <div className="bg-white border border-amber-300 rounded-xl p-4 shadow-sm space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Extracting emails with Firecrawl... ({progress.current}/{progress.total})</span>
            </span>
            <span className="font-mono text-slate-600 truncate max-w-xs">{progress.currentUrl}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-300"
              style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Extraction Table & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleExtractBatch(false)}
              disabled={isExtracting || uniqueLinksData.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExtracting ? 'Extracting...' : `Extract All (${uniqueLinksData.length} Links)`}</span>
            </button>

            <button
              onClick={() => handleExtractBatch(true)}
              disabled={isExtracting || uniqueLinksData.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Extract Missing Only</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search links, brands, emails..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({uniqueLinksData.length})
              </button>
              <button
                onClick={() => setFilterMode('has_emails')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  filterMode === 'has_emails' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Found ({linksWithEmailsCount})
              </button>
              <button
                onClick={() => setFilterMode('no_emails')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  filterMode === 'no_emails' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({uniqueLinksData.length - linksWithEmailsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4">Page Name</th>
                <th className="py-2.5 px-4">Link Caption 1 (Target Domain)</th>
                <th className="py-2.5 px-4">Extracted Emails</th>
                <th className="py-2.5 px-4">Source / Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No links match your filter</p>
                    <p className="text-xs text-slate-400 mt-1">Make sure ads have been scraped with Link Caption 1 values.</p>
                  </td>
                </tr>
              ) : (
                filteredLinks.map((item, idx) => {
                  const extracted = extractedMap[item.link];
                  const emails = extracted?.emails || [];
                  const isScrapingThis = extracted?.status === 'scraping';
                  const targetHref = item.link.startsWith('http') ? item.link : `https://${item.link}`;

                  return (
                    <tr key={item.link} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.pageName || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <a
                          href={targetHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 font-mono text-[11px] max-w-xs truncate"
                        >
                          <span className="truncate">{item.link}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-0.5" />
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        {isScrapingThis ? (
                          <div className="flex items-center space-x-1.5 text-amber-600 font-medium text-xs">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Crawling with Firecrawl...</span>
                          </div>
                        ) : emails.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {emails.map(email => (
                              <button
                                key={email}
                                onClick={() => handleCopySingleEmail(email)}
                                title="Click to copy email address"
                                className="group flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors"
                              >
                                <span>{email}</span>
                                {copiedEmail === email ? (
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-amber-600 opacity-60 group-hover:opacity-100 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : extracted?.status === 'completed' ? (
                          <span className="text-slate-400 italic text-[11px]">No emails detected on page</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">— Not extracted yet —</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isScrapingThis ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Scraping...
                          </span>
                        ) : emails.length > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            extracted?.source === 'firecrawl' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {extracted?.source === 'firecrawl' ? '🔥 Firecrawl Live' : '⚡ Domain Lead'}
                          </span>
                        ) : extracted?.status === 'completed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Completed (0)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleExtractOne(item)}
                          disabled={isExtracting || isScrapingThis}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded transition-colors"
                        >
                          {emails.length > 0 ? 'Re-crawl' : 'Find Emails'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
