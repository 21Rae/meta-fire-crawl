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
  ShieldCheck, 
  Zap, 
  Globe, 
  Shield,
  Smartphone
} from 'lucide-react';
import { AdRecord, ScraperConfig, ExtractedEmailResult } from '../types';
import { 
  isMetaOrSocialLink, 
  isMetaSocialLink, 
  isAppStoreLink, 
  getCleanDomainOrUrl, 
  getLinkExclusionReason 
} from '../utils/urlFilters';

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
  const [autoDropSocial, setAutoDropSocial] = useState(config.autoDropSocialLinks !== false);
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
  const [filterMode, setFilterMode] = useState<'all' | 'target_leads' | 'dropped_excluded' | 'has_emails'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showConfig, setShowConfig] = useState(!config.firecrawlApiKey);

  // Extract unique links from Link Caption 1 and annotate social / app store links
  const uniqueLinksData = useMemo(() => {
    const map = new Map<string, { 
      link: string; 
      pageName: string; 
      adIds: string[]; 
      creativeBody: string; 
      snapshotUrl: string;
      isExcluded: boolean;
      isSocial: boolean;
      isAppStore: boolean;
      exclusionReason: 'meta_social' | 'app_store' | 'invalid' | null;
      domain: string;
    }>();
    
    ads.forEach(ad => {
      const link = (ad.linkCaption1 || '').trim();
      if (link) {
        const isSocial = isMetaSocialLink(link);
        const isAppStore = isAppStoreLink(link);
        const isExcluded = isSocial || isAppStore;
        const exclusionReason = getLinkExclusionReason(link);
        const domain = getCleanDomainOrUrl(link);

        if (!map.has(link)) {
          map.set(link, {
            link,
            pageName: ad.pageName,
            adIds: [ad.id],
            creativeBody: ad.creativeBody1,
            snapshotUrl: ad.snapshotUrl,
            isExcluded,
            isSocial,
            isAppStore,
            exclusionReason,
            domain
          });
        } else {
          map.get(link)!.adIds.push(ad.id);
        }
      }
    });

    return Array.from(map.values());
  }, [ads]);

  // Separation of Target Commercial Leads vs Excluded (Social + App Stores) Links
  const nonExcludedLinks = useMemo(() => uniqueLinksData.filter(item => !item.isExcluded), [uniqueLinksData]);
  const excludedLinks = useMemo(() => uniqueLinksData.filter(item => item.isExcluded), [uniqueLinksData]);
  const appStoreLinks = useMemo(() => uniqueLinksData.filter(item => item.isAppStore), [uniqueLinksData]);
  const metaSocialLinks = useMemo(() => uniqueLinksData.filter(item => item.isSocial), [uniqueLinksData]);

  // Toggle auto drop handler
  const handleToggleAutoDrop = (enabled: boolean) => {
    setAutoDropSocial(enabled);
    onUpdateConfig({ autoDropSocialLinks: enabled });
  };

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
    onUpdateConfig({ firecrawlApiKey: apiKey.trim(), autoDropSocialLinks: autoDropSocial });
    setKeyTestStatus({ valid: true, message: 'Saved successfully!' });
  };

  // Run extraction for a single URL
  const extractSingleUrl = async (link: string, pageName?: string): Promise<ExtractedEmailResult> => {
    const isAppStore = isAppStoreLink(link);
    const isSocial = isMetaSocialLink(link);

    if (autoDropSocial && (isSocial || isAppStore)) {
      return {
        url: link,
        originalLink: link,
        pageName: pageName || '',
        status: 'skipped',
        isSocialLink: isSocial,
        isAppStoreLink: isAppStore,
        exclusionType: isAppStore ? 'app_store' : 'meta_social',
        emails: [],
        error: isAppStore
          ? 'Auto-dropped Google Play / Apple App Store link to conserve tokens'
          : 'Auto-dropped Facebook/Instagram social link to conserve tokens'
      };
    }

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
    // Determine active target items (excluding Social & App Stores if autoDropSocial is enabled)
    const baseList = autoDropSocial ? nonExcludedLinks : uniqueLinksData;

    const targets = baseList.filter(item => {
      if (onlyMissing) {
        const existing = extractedMap[item.link];
        return !existing || (existing.emails.length === 0 && existing.status !== 'skipped');
      }
      return true;
    });

    if (targets.length === 0) return;

    setIsExtracting(true);
    setProgress({ current: 0, total: targets.length, currentUrl: targets[0].link });

    const newExtracted = { ...extractedMap };
    let updatedAds = [...ads];

    // Mark skipped social and app store links if auto-drop is on
    if (autoDropSocial) {
      excludedLinks.forEach(item => {
        if (!newExtracted[item.link]) {
          newExtracted[item.link] = {
            url: item.link,
            originalLink: item.link,
            pageName: item.pageName,
            status: 'skipped',
            isSocialLink: item.isSocial,
            isAppStoreLink: item.isAppStore,
            exclusionType: item.isAppStore ? 'app_store' : 'meta_social',
            emails: [],
            error: item.isAppStore
              ? 'Auto-dropped Google Play / Apple App Store link to conserve tokens'
              : 'Auto-dropped Facebook/Instagram social link to conserve tokens'
          };
        }
      });
    }

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
  const handleExtractOne = async (item: { link: string; pageName: string; isExcluded?: boolean }) => {
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
    if (!emailList) return;
    navigator.clipboard.writeText(emailList);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export full CSV with lead emails
  const handleExportCsvWithEmails = () => {
    const rows = [
      ['Page Name', 'Link Caption 1', 'Destination URL', 'Link Type', 'Extracted Emails', 'Total Emails', 'Status', 'Timestamp']
    ];

    uniqueLinksData.forEach(item => {
      const res = extractedMap[item.link];
      const emails = res?.emails || [];
      const linkType = item.isAppStore 
        ? 'App Store / Play Store' 
        : item.isSocial 
        ? 'FB / IG Social' 
        : 'Commercial Domain';

      rows.push([
        `"${(item.pageName || '').replace(/"/g, '""')}"`,
        `"${(item.link || '').replace(/"/g, '""')}"`,
        `"${(res?.url || item.link).replace(/"/g, '""')}"`,
        `"${linkType}"`,
        `"${emails.join('; ')}"`,
        `${emails.length}`,
        `"${res?.status || (item.isExcluded ? 'auto_dropped' : 'pending')}"`,
        `"${res?.timestamp || ''}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meta_ads_leads_emails_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for the UI table
  const filteredLinks = useMemo(() => {
    return uniqueLinksData.filter(item => {
      const extracted = extractedMap[item.link];
      const emails = extracted?.emails || [];

      if (filterMode === 'target_leads' && item.isExcluded) return false;
      if (filterMode === 'dropped_excluded' && !item.isExcluded) return false;
      if (filterMode === 'has_emails' && emails.length === 0) return false;

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

  const targetLeadsCount = nonExcludedLinks.length;
  const droppedTotalCount = excludedLinks.length;
  const droppedAppStoreCount = appStoreLinks.length;
  const droppedSocialCount = metaSocialLinks.length;

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
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>Firecrawl Email Extractor</span>
                <span className="bg-amber-400/30 text-amber-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-amber-300/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-200" /> Auto-Drop Social & App Stores Active
                </span>
              </h2>
              <p className="text-xs text-orange-100">
                Crawls destination commercial domains in <span className="font-semibold underline">Link Caption 1</span> to extract emails, automatically dropping Facebook, Instagram, Google Play & Apple App Store URLs to conserve your tokens.
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

      {/* Auto-Drop Social & App Store Protection Alert / Control */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
            <Shield className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-950">Token Protection Engine</span>
              <span className="bg-emerald-100 text-emerald-800 font-semibold text-[10px] px-2 py-0.2 rounded-full border border-emerald-200">
                {droppedTotalCount} Non-Lead Links Dropped ({droppedTotalCount} Tokens Saved)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Filters out <span className="font-semibold">Facebook & Instagram</span> ({droppedSocialCount}) and <span className="font-semibold">Google Play & Apple App Store</span> ({droppedAppStoreCount}) links (e.g. <code className="text-amber-900 bg-amber-200/60 px-1 py-0.2 rounded text-[11px]">play.google.com</code>, <code className="text-amber-900 bg-amber-200/60 px-1 py-0.2 rounded text-[11px]">apps.apple.com</code>, <code className="text-amber-900 bg-amber-200/60 px-1 py-0.2 rounded text-[11px]">fb.me</code>) to focus 100% on real commercial websites.
            </p>
          </div>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs hover:bg-amber-50/50 transition-colors shrink-0">
          <input
            type="checkbox"
            checked={autoDropSocial}
            onChange={e => handleToggleAutoDrop(e.target.checked)}
            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
          />
          <span className="text-xs font-semibold text-slate-800 select-none">
            Auto-drop Social & App Store links
          </span>
        </label>
      </div>

      {/* API Configuration Card */}
      {showConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm">Firecrawl API Credentials & Optimization</h3>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Target Leads</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{targetLeadsCount}</div>
            <span className="text-[11px] text-slate-500">Commercial websites</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Tokens Protected</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{droppedTotalCount}</div>
            <span className="text-[11px] text-emerald-600">{droppedSocialCount} Social + {droppedAppStoreCount} App Stores</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Domains Scraped</span>
            <div className="text-2xl font-bold text-indigo-700 mt-0.5">{linksWithEmailsCount} / {targetLeadsCount}</div>
            <span className="text-[11px] text-indigo-600">Websites with emails</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Emails</span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{totalEmailsFound}</div>
            <span className="text-[11px] text-amber-600">Verified lead emails</span>
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
              disabled={isExtracting || targetLeadsCount === 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExtracting ? 'Extracting...' : `Extract All (${targetLeadsCount} Target Leads)`}</span>
            </button>

            <button
              onClick={() => handleExtractBatch(true)}
              disabled={isExtracting || targetLeadsCount === 0}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Extract Missing Only</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
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
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({uniqueLinksData.length})
              </button>
              <button
                onClick={() => setFilterMode('target_leads')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterMode === 'target_leads' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Target Leads ({targetLeadsCount})
              </button>
              <button
                onClick={() => setFilterMode('has_emails')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterMode === 'has_emails' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Emails ({linksWithEmailsCount})
              </button>
              <button
                onClick={() => setFilterMode('dropped_excluded')}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterMode === 'dropped_excluded' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dropped / Excluded ({droppedTotalCount})
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
                  const isSkippedExcluded = item.isExcluded && (autoDropSocial || extracted?.status === 'skipped');
                  const targetHref = item.link.startsWith('http') ? item.link : `https://${item.link}`;

                  return (
                    <tr key={item.link} className={`transition-colors ${isSkippedExcluded ? 'bg-slate-50/50 opacity-85' : 'hover:bg-slate-50/80'}`}>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.pageName || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <a
                            href={targetHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 font-mono text-[11px] max-w-xs truncate"
                          >
                            <span className="truncate">{item.link}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-0.5" />
                          </a>
                          
                          {item.isAppStore && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              <Smartphone className="w-2.5 h-2.5 mr-0.5" /> App Store
                            </span>
                          )}

                          {item.isSocial && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              FB/IG Social
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isScrapingThis ? (
                          <div className="flex items-center space-x-1.5 text-amber-600 font-medium text-xs">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Crawling with Firecrawl...</span>
                          </div>
                        ) : isSkippedExcluded ? (
                          <span className="inline-flex items-center space-x-1 text-slate-500 font-mono text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {item.isAppStore ? 'Auto-dropped App Store (Saved token)' : 'Auto-dropped Social (Saved token)'}
                            </span>
                          </span>
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
                        ) : isSkippedExcluded ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🛡️ Dropped
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
                        {item.isExcluded && autoDropSocial ? (
                          <button
                            onClick={() => handleExtractOne(item)}
                            disabled={isExtracting || isScrapingThis}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Force crawl this link (uses tokens)"
                          >
                            Force Crawl
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExtractOne(item)}
                            disabled={isExtracting || isScrapingThis}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded transition-colors"
                          >
                            {emails.length > 0 ? 'Re-crawl' : 'Find Emails'}
                          </button>
                        )}
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
