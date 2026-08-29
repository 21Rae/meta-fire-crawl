import React, { useState, useMemo, useEffect } from 'react';
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
  Smartphone,
  Lock,
  Server,
  Filter,
  CheckCircle,
  Building2,
  ListFilter
} from 'lucide-react';
import { AdRecord, ScraperConfig, ExtractedEmailResult, SortedMailLead } from '../types';
import { 
  isMetaOrSocialLink, 
  isMetaSocialLink, 
  isAppStoreLink, 
  getCleanDomainOrUrl, 
  getLinkExclusionReason 
} from '../utils/urlFilters';
import { 
  sortMail, 
  exportSortedMailCsv, 
  isContactOrInfoEmail 
} from '../utils/mailSorter';

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
  const [prompt, setPrompt] = useState('extract all emails');
  const [autoDropSocial, setAutoDropSocial] = useState(config.autoDropSocialLinks !== false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  
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
  const [filterMode, setFilterMode] = useState<'all' | 'target_leads' | 'sorted_mail' | 'has_emails' | 'dropped_excluded'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSortedTsv, setCopiedSortedTsv] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Check server environment status
  useEffect(() => {
    fetch('/api/config/status')
      .then(res => res.json())
      .then(data => {
        setHasServerKey(Boolean(data.hasFirecrawlKey));
      })
      .catch(() => setHasServerKey(false));
  }, []);

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

  // Sort Mail: Only return emails that are 'contact' or 'info' and drop the rest
  const sortedMailLeads = useMemo(() => {
    return sortMail(ads, extractedMap);
  }, [ads, extractedMap]);

  // Filtered sorted mail leads based on search query
  const filteredSortedMailLeads = useMemo(() => {
    if (!searchQuery) return sortedMailLeads;
    const q = searchQuery.toLowerCase();
    return sortedMailLeads.filter(lead => 
      lead.businessName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.domain.toLowerCase().includes(q)
    );
  }, [sortedMailLeads, searchQuery]);

  // Toggle auto drop handler
  const handleToggleAutoDrop = (enabled: boolean) => {
    setAutoDropSocial(enabled);
    onUpdateConfig({ autoDropSocialLinks: enabled });
  };

  // Test Firecrawl API Key on server
  const handleTestKey = async () => {
    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await fetch('/api/firecrawl/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setKeyTestStatus({
        valid: data.valid,
        message: data.message || (data.valid ? 'Firecrawl connection verified!' : 'Invalid API Key')
      });
      if (data.valid) {
        setHasServerKey(true);
      }
    } catch (err: any) {
      setKeyTestStatus({ valid: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTestingKey(false);
    }
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

  // Copy Sorted Leads as TSV (Business Name \t Email)
  const handleCopySortedTsv = () => {
    if (sortedMailLeads.length === 0) return;
    const tsv = ['Business Name\tEmail', ...sortedMailLeads.map(l => `${l.businessName}\t${l.email}`)].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedSortedTsv(true);
    setTimeout(() => setCopiedSortedTsv(false), 2500);
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

  // Filtered rows for the general UI table
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
                <span>Firecrawl Email & Lead Hunter</span>
                <span className="bg-amber-400/30 text-amber-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-amber-300/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-200" /> Auto-Drop Social & App Stores Active
                </span>
              </h2>
              <p className="text-xs text-orange-100">
                Crawls destination commercial domains in <span className="font-semibold underline">Link Caption 1</span> to extract emails, automatically dropping Facebook, Instagram, Google Play & Apple App Store URLs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Quick Sort Mail Button */}
          <button
            onClick={() => setFilterMode('sorted_mail')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow transition-all ${
              filterMode === 'sorted_mail'
                ? 'bg-amber-300 text-slate-950 ring-2 ring-white'
                : 'bg-white text-orange-950 hover:bg-orange-50'
            }`}
          >
            <ListFilter className="w-4 h-4 text-orange-600" />
            <span>⚡ Sort Mail ({sortedMailLeads.length})</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold backdrop-blur transition-colors border border-white/20"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide Config' : 'Secrets & Prompt'}</span>
          </button>
          
          <button
            onClick={handleCopyAllEmails}
            disabled={totalEmailsFound === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-orange-900 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold shadow transition-all"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-orange-600" />}
            <span>{copiedAll ? 'Copied!' : `Copy All (${totalEmailsFound})`}</span>
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
              <Lock className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm">Server Secrets & Extraction Configuration</h3>
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
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Server Secret:</span>
                  <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs">
                    FIRECRAWL_API_KEY
                  </code>
                </span>
                {hasServerKey ? (
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Configured in Server Env
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 font-medium text-[11px] px-2 py-0.5 rounded-full">
                    Using Simulated Fallback
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isTestingKey ? 'Verifying...' : '⚡ Test Firecrawl Secret'}
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
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Emails</span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{totalEmailsFound}</div>
            <span className="text-[11px] text-amber-600">{linksWithEmailsCount} domains with email</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        {/* Dedicated Sort Mail Metric Card */}
        <div 
          onClick={() => setFilterMode('sorted_mail')}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-400/80 hover:border-amber-500 rounded-xl p-4 flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-101"
        >
          <div>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wider">
              <span>⚡ Sort Mail Leads</span>
            </span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{sortedMailLeads.length}</div>
            <span className="text-[11px] font-medium text-amber-800">Only contact & info emails</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <ListFilter className="w-5 h-5" />
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

      {/* SPECIAL SORT MAIL VIEW OR GENERAL TABLE */}
      {filterMode === 'sorted_mail' ? (
        /* ==================== SORT MAIL DEDICATED VIEW ==================== */
        <div className="bg-white border border-amber-300/80 rounded-xl shadow-md overflow-hidden space-y-0">
          {/* Top Sort Mail Callout Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 p-4 sm:p-5 border-b border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-amber-600 text-white p-1.5 rounded-lg">
                  <ListFilter className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Sorted Mail Output: Contact & Info Leads
                </h3>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                  {sortedMailLeads.length} Clean Pairs
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Only returns emails matching <strong className="text-slate-800">contact@</strong> or <strong className="text-slate-800">info@</strong> prefixes and automatically drops all other addresses (support, personal, billing). Alphabetically sorted by <strong className="text-slate-800">Business Name</strong> for instant export.
              </p>
            </div>

            {/* Export & Copy actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopySortedTsv}
                disabled={sortedMailLeads.length === 0}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
              >
                {copiedSortedTsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copiedSortedTsv ? 'Copied TSV!' : 'Copy 2-Col Table'}</span>
              </button>

              <button
                onClick={() => exportSortedMailCsv(sortedMailLeads, 'two-column')}
                disabled={sortedMailLeads.length === 0}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export Clean CSV (Business Name & Email)</span>
              </button>

              <button
                onClick={() => exportSortedMailCsv(sortedMailLeads, 'full')}
                disabled={sortedMailLeads.length === 0}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Full CSV</span>
              </button>
            </div>
          </div>

          {/* Search bar & filter pills within Sort Mail view */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by business name, email, or domain..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">
                Showing {filteredSortedMailLeads.length} of {sortedMailLeads.length} leads
              </span>
              <button
                onClick={() => setFilterMode('all')}
                className="text-xs text-blue-600 hover:underline font-medium pl-2"
              >
                Back to All Links
              </button>
            </div>
          </div>

          {/* Sorted Mail Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Business Name (Page Name)</th>
                  <th className="py-3 px-4">Sorted Clean Email (Contact / Info)</th>
                  <th className="py-3 px-4">Email Type</th>
                  <th className="py-3 px-4">Destination Domain</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSortedMailLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-700">No contact or info emails match the criteria</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Run "Extract All" in Firecrawl or crawl more landing pages to find contact@ or info@ addresses.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSortedMailLeads.map((lead, idx) => (
                    <tr key={`${lead.businessName}-${lead.email}-${idx}`} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lead.businessName}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        <span className="bg-amber-50 border border-amber-200 text-amber-950 px-2 py-1 rounded-md inline-flex items-center space-x-1.5">
                          <Mail className="w-3 h-3 text-amber-600" />
                          <span>{lead.email}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          lead.emailType === 'contact'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {lead.emailType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <span>{lead.domain}</span>
                          {lead.originalLink && (
                            <a
                              href={lead.originalLink.startsWith('http') ? lead.originalLink : `https://${lead.originalLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleCopySingleEmail(lead.email)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded transition-colors inline-flex items-center space-x-1"
                        >
                          {copiedEmail === lead.email ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copy Email</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== GENERAL EXTRACTION TABLE ==================== */
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
                  onClick={() => setFilterMode('sorted_mail')}
                  className={`px-2.5 py-1.5 rounded-md font-bold whitespace-nowrap transition-colors bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200`}
                >
                  ⚡ Sort Mail ({sortedMailLeads.length})
                </button>
                <button
                  onClick={() => setFilterMode('dropped_excluded')}
                  className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filterMode === 'dropped_excluded' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dropped ({droppedTotalCount})
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
                              {emails.map(email => {
                                const check = isContactOrInfoEmail(email);
                                return (
                                  <button
                                    key={email}
                                    onClick={() => handleCopySingleEmail(email)}
                                    title="Click to copy email address"
                                    className={`group flex items-center space-x-1 border px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors ${
                                      check.isMatch
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span>{email}</span>
                                    {check.isMatch && (
                                      <span className="text-[9px] bg-amber-200 text-amber-800 px-1 rounded uppercase font-bold">
                                        {check.type}
                                      </span>
                                    )}
                                    {copiedEmail === email ? (
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:opacity-100 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
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
      )}
    </div>
  );
};
