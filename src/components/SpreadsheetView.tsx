import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  ArrowUpDown, 
  Filter, 
  Download, 
  Layers, 
  Eye, 
  Check, 
  RefreshCw, 
  ChevronRight,
  Sparkles,
  X,
  Flame,
  Mail,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { AdRecord } from '../types';
import { HEADERS } from '../utils/constants';
import { adToRow, exportToCsv, copySpreadsheetToClipboard } from '../utils/adProcessor';
import { isMetaOrSocialLink, isAppStoreLink, isMetaSocialLink } from '../utils/urlFilters';
import { sortMail, exportSortedMailCsv } from '../utils/mailSorter';
import { ListFilter } from 'lucide-react';

interface SpreadsheetViewProps {
  sheetName: string;
  ads: AdRecord[];
  onRefresh: () => void;
  isScraping: boolean;
  onOpenSetup: () => void;
  onOpenFirecrawl?: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  sheetName,
  ads,
  onRefresh,
  isScraping,
  onOpenSetup,
  onOpenFirecrawl
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'VIDEO' | 'IMAGE' | 'MEME'>('ALL');
  const [linkFilter, setLinkFilter] = useState<'ALL' | 'TARGET_LEADS' | 'EXCLUDED'>('ALL');
  const [sortField, setSortField] = useState<keyof AdRecord>('totalReach');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdRecord | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: string } | null>({
    row: 1,
    col: 1,
    val: ads[0]?.pageName || 'No Data'
  });
  const [copied, setCopied] = useState(false);
  const sortedLeads = useMemo(() => sortMail(ads), [ads]);

  // Filtering & Sorting
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      if (statusFilter === 'ACTIVE' && ad.adStatus !== 'active') return false;
      if (statusFilter === 'INACTIVE' && ad.adStatus !== 'inactive') return false;
      if (mediaFilter !== 'ALL' && ad.mediaType !== mediaFilter) return false;

      const link = (ad.linkCaption1 || '').trim();
      const isExcluded = isMetaOrSocialLink(link);
      if (linkFilter === 'TARGET_LEADS' && isExcluded) return false;
      if (linkFilter === 'EXCLUDED' && !isExcluded) return false;

      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        return (
          ad.pageName.toLowerCase().includes(query) ||
          ad.linkCaption1.toLowerCase().includes(query) ||
          ad.snapshotUrl.toLowerCase().includes(query) ||
          ad.creativeBody1.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }, [ads, searchFilter, statusFilter, mediaFilter, sortField, sortAsc]);

  const handleSort = (field: keyof AdRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCopyClipboard = () => {
    copySpreadsheetToClipboard(filteredAds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert column index to Google Sheets column letter (0->A, 1->B, 2->C, 3->D)
  const getColLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white border border-slate-200">
      {/* Top Toolbar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs text-slate-800 tracking-wide font-mono">
              {sheetName}
            </span>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {filteredAds.length} of {ads.length} ads
          </span>

          {/* Quick Filters */}
          <div className="flex items-center space-x-1 bg-white p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-white p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setMediaFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium ${
                mediaFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setMediaFilter('VIDEO')}
              className={`px-2 py-0.5 rounded font-medium ${
                mediaFilter === 'VIDEO' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              Video Only
            </button>
            <button
              onClick={() => setMediaFilter('IMAGE')}
              className={`px-2 py-0.5 rounded font-medium ${
                mediaFilter === 'IMAGE' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Image Only
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-white p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setLinkFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium ${
                linkFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Links
            </button>
            <button
              onClick={() => setLinkFilter('TARGET_LEADS')}
              className={`px-2 py-0.5 rounded font-medium ${
                linkFilter === 'TARGET_LEADS' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
              }`}
              title="Show only ads linking to commercial websites (drops Social & App Stores)"
            >
              Target Leads
            </button>
            <button
              onClick={() => setLinkFilter('EXCLUDED')}
              className={`px-2 py-0.5 rounded font-medium ${
                linkFilter === 'EXCLUDED' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Show only dropped Facebook, Instagram, Google Play & Apple Store ads"
            >
              Dropped Non-Leads
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter Page, ID, Text, Country..."
              className="text-xs bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1 text-slate-800 w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium shadow-2xs"
            title="Copy TSV to clipboard (Direct Google Sheets Paste)"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {sortedLeads.length > 0 && (
            <button
              onClick={() => exportSortedMailCsv(sortedLeads, 'two-column')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold shadow-2xs transition-all"
              title="Export 2-column CSV with Business Name and Contact/Info Email"
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-600" />
              <span>Sort Mail CSV ({sortedLeads.length})</span>
            </button>
          )}

          {onOpenFirecrawl && (
            <button
              onClick={onOpenFirecrawl}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold shadow-2xs transition-all"
              title="Extract emails from destination links using Firecrawl"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Firecrawl Emails</span>
            </button>
          )}

          <button
            onClick={() => exportToCsv(filteredAds, `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium shadow-2xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Formula Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center space-x-3 text-xs font-mono">
        <div className="bg-white px-2 py-0.5 border border-slate-300 rounded font-bold text-slate-700 min-w-[50px] text-center">
          {selectedCell ? `${getColLetter(selectedCell.col)}${selectedCell.row}` : 'A1'}
        </div>
        <span className="text-slate-400 font-serif italic text-sm select-none">fx</span>
        <div className="flex-1 bg-white px-3 py-1 border border-slate-200 rounded text-slate-800 text-[11px] truncate shadow-inner">
          {selectedCell?.val || ''}
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="flex-1 overflow-auto bg-slate-100">
        {filteredAds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Ads in {sheetName}</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchFilter 
                ? 'No ads matched your search filters. Try clearing the filter.' 
                : 'Click "⚡ Scrape 1-time" or "🔄 Scrape Daily" in the top bar to pull Meta ads.'}
            </p>
            <button
              onClick={onOpenSetup}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Configure ⚙️ Setup Sheet
            </button>
          </div>
        ) : (
          <table className="border-collapse table-fixed w-max text-xs select-text">
            {/* Header Row */}
            <thead>
              <tr className="bg-[#1e293b] text-[#f8fafc] sticky top-0 z-20 shadow-sm">
                {/* Row Number Header */}
                <th className="w-12 py-2 px-1 text-center font-mono text-[10px] text-slate-400 bg-slate-900 border-r border-b border-slate-700 sticky left-0 z-30">
                  #
                </th>
                {HEADERS.map((header, colIdx) => (
                  <th
                    key={header}
                    onClick={() => {
                      if (header === 'Page Name') handleSort('pageName');
                      if (header === 'Link Caption 1') handleSort('linkCaption1');
                      if (header === 'Snapshot URL') handleSort('snapshotUrl');
                      if (header === 'Creative Body 1') handleSort('creativeBody1');
                    }}
                    className="py-2 px-3 text-left font-semibold text-[11px] border-r border-b border-slate-700 whitespace-nowrap tracking-tight cursor-pointer hover:bg-slate-800"
                    style={{ minWidth: getHeaderWidth(colIdx), width: getHeaderWidth(colIdx) }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span>{header}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({getColLetter(colIdx)})</span>
                      </div>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {filteredAds.map((ad, rowIdx) => {
                const rowNum = rowIdx + 2; // Row 1 is header in Excel
                const rowData = adToRow(ad);
                const isZebra = rowIdx % 2 === 0;

                return (
                  <tr
                    key={ad.id + rowIdx}
                    className={`border-b border-slate-200 transition-colors hover:bg-blue-50/70 group ${
                      isZebra ? 'bg-white' : 'bg-[#f8f9fa]'
                    }`}
                  >
                    {/* Row Index Column (Sticky Left) */}
                    <td
                      className="py-2 px-1 text-center font-mono text-[10px] text-slate-400 bg-slate-50 border-r border-slate-300 sticky left-0 z-10 select-none group-hover:bg-blue-100 group-hover:text-blue-700"
                    >
                      <button
                        onClick={() => setSelectedAd(ad)}
                        className="hover:underline flex items-center justify-center w-full"
                        title="Click to view ad details"
                      >
                        <span>{rowNum}</span>
                      </button>
                    </td>

                    {/* 4 Returned Columns: Page Name, Link Caption 1, Snapshot URL, Creative Body 1 */}
                    {rowData.map((val, colIdx) => {
                      const header = HEADERS[colIdx];
                      const isSnapshotUrl = header === 'Snapshot URL';
                      const isCreativeBody = header === 'Creative Body 1';
                      const isLinkCaption = header === 'Link Caption 1';
                      const isPageName = header === 'Page Name';

                      return (
                        <td
                          key={colIdx}
                          onClick={() => setSelectedCell({
                            row: rowNum,
                            col: colIdx,
                            val: String(val ?? '')
                          })}
                          className={`py-2 px-3 border-r border-slate-200 text-slate-800 text-[11px] ${
                            isCreativeBody ? 'max-w-md' : 'max-w-xs truncate'
                          }`}
                          title={String(val ?? '')}
                        >
                          {isSnapshotUrl ? (
                            <a
                              href={String(val)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1155cc] underline hover:text-blue-800 flex items-center space-x-1 font-mono text-[11px]"
                            >
                              <span className="truncate">{String(val)}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 ml-1 inline text-blue-500" />
                            </a>
                          ) : isLinkCaption ? (
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between space-x-1">
                                <div className="flex items-center space-x-1 truncate">
                                  <span className="font-mono text-slate-700 truncate">
                                    {String(val || '—')}
                                  </span>
                                  {isAppStoreLink(String(val || '')) && (
                                    <span className="inline-flex items-center text-[9px] px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold shrink-0">
                                      <Smartphone className="w-2.5 h-2.5 mr-0.5" /> App Store
                                    </span>
                                  )}
                                  {isMetaSocialLink(String(val || '')) && (
                                    <span className="inline-flex items-center text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold shrink-0">
                                      FB/IG
                                    </span>
                                  )}
                                </div>
                                {String(val || '').trim() && onOpenFirecrawl && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenFirecrawl();
                                    }}
                                    title="Open Firecrawl tool to extract emails for this link"
                                    className="text-amber-600 hover:text-amber-800 p-0.5 rounded hover:bg-amber-50 shrink-0"
                                  >
                                    <Flame className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {ad.extractedEmails && ad.extractedEmails.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span className="inline-flex items-center space-x-0.5 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-mono">
                                    <Mail className="w-2.5 h-2.5 text-amber-600" />
                                    <span>{ad.extractedEmails[0]}</span>
                                    {ad.extractedEmails.length > 1 && (
                                      <span className="text-amber-600 font-bold">+{ad.extractedEmails.length - 1}</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : isPageName ? (
                            <span className="font-semibold text-slate-900">
                              {String(val || '')}
                            </span>
                          ) : (
                            <span className="line-clamp-2 leading-relaxed text-slate-700">
                              {String(val || '—')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sheet Tabs Footer (Matching Google Sheets Tabs) */}
      <div className="bg-slate-200 border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 bg-white border-t-2 border-t-emerald-600 border-x border-slate-300 px-3 py-1 rounded-t shadow-2xs font-bold text-slate-800">
            <span>{sheetName}</span>
          </div>
          <span className="text-[11px] text-slate-500 ml-3">
            Showing {filteredAds.length} rows × {HEADERS.length} columns (A to D: Page Name, Link Caption 1, Snapshot URL, Creative Body 1)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-600 text-[11px]">
          <span>Total Ads: <strong className="font-mono text-slate-800">{filteredAds.length}</strong></span>
          <span>•</span>
          <span>Active Ads: <strong className="text-emerald-700">{filteredAds.filter(a => a.adStatus === 'active').length}</strong></span>
        </div>
      </div>

      {/* Ad Detail Drawer Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="font-bold text-base">{selectedAd.pageName}</h3>
                <span className="text-xs text-slate-400 font-mono">Ad ID: {selectedAd.id} • Page ID: {selectedAd.pageId}</span>
              </div>
              <button
                onClick={() => setSelectedAd(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Reach & Status Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Reach</span>
                  <div className="text-lg font-black text-slate-800">{selectedAd.totalReach.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Daily Avg Reach</span>
                  <div className="text-lg font-black text-slate-800">{Number(selectedAd.avgDailyReach || 0).toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Days Running</span>
                  <div className="text-lg font-black text-slate-800">{selectedAd.daysRunning || '1'} days</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                  <div className={`text-sm font-bold uppercase mt-1 ${
                    selectedAd.adStatus === 'active' ? 'text-emerald-700 bg-emerald-100 py-0.5 rounded' : 'text-rose-700 bg-rose-100 py-0.5 rounded'
                  }`}>
                    {selectedAd.adStatus}
                  </div>
                </div>
              </div>

              {/* Creative Copy Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                  Creative Primary Copy
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedAd.creativeBody1 || 'No primary text supplied.'}
                </div>

                {selectedAd.creativeBody2 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                    <span className="font-bold text-slate-500">Variant 2: </span>
                    {selectedAd.creativeBody2}
                  </div>
                )}
              </div>

              {/* Headline & Link */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                  Link Headlines & Captions
                </h4>
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div className="font-bold text-slate-900 text-sm">{selectedAd.linkTitle1 || 'Learn More'}</div>
                  <div className="text-slate-600 mt-1">{selectedAd.linkDescription1}</div>
                  <div className="text-blue-600 font-mono mt-1 text-[11px]">{selectedAd.linkCaption1}</div>
                </div>
              </div>

              {/* Demographics Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                  Demographic Breakdown (DSA Data)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">Gender Split:</span>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span>👨 Male: {selectedAd.totalMale.toLocaleString()}</span>
                      <span>👩 Female: {selectedAd.totalFemale.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">Reached Countries:</span>
                    <div className="mt-1 text-slate-800 text-[11px] truncate">
                      {selectedAd.countries || 'EU & UK'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end space-x-2">
                <a
                  href={selectedAd.snapshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <span>Open Snapshot on Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getHeaderWidth(idx: number): number {
  const widths = [220, 240, 260, 480];
  return widths[idx] || 200;
}
