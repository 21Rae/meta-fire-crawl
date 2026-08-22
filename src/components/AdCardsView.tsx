import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  Video, 
  Image as ImageIcon, 
  Flame, 
  Calendar, 
  Users, 
  Globe, 
  Share2, 
  Filter, 
  Search,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { AdRecord } from '../types';

interface AdCardsViewProps {
  ads: AdRecord[];
}

export const AdCardsView: React.FC<AdCardsViewProps> = ({ ads }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedMedia, setSelectedMedia] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const brands = useMemo(() => {
    const list = Array.from(new Set(ads.map(a => a.pageName))).filter(Boolean);
    return ['ALL', ...list];
  }, [ads]);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      if (selectedBrand !== 'ALL' && ad.pageName !== selectedBrand) return false;
      if (selectedMedia !== 'ALL' && ad.mediaType !== selectedMedia) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          ad.pageName.toLowerCase().includes(query) ||
          ad.creativeBody1.toLowerCase().includes(query) ||
          ad.linkTitle1.toLowerCase().includes(query) ||
          ad.id.includes(query)
        );
      }
      return true;
    });
  }, [ads, selectedBrand, selectedMedia, searchTerm]);

  const copyAdText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <span>🖼️ Creative Ad Cards Gallery</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredAds.length} Creatives
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual inspection of primary copy, headlines, hooks, reach metrics, and demographic concentrations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand selector */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            {brands.map(b => (
              <option key={b} value={b}>
                {b === 'ALL' ? 'All Advertisers' : b}
              </option>
            ))}
          </select>

          {/* Media Format */}
          <select
            value={selectedMedia}
            onChange={e => setSelectedMedia(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Media Formats</option>
            <option value="VIDEO">Video Only</option>
            <option value="IMAGE">Image Only</option>
            <option value="MEME">Meme / Overlay Only</option>
          </select>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search copy or hook..."
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 w-44 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Ad Cards */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No ad creatives match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map(ad => {
            const malePercent = ad.totalReach > 0 
              ? Math.round((ad.totalMale / (ad.totalMale + ad.totalFemale || 1)) * 100)
              : 50;
            const femalePercent = 100 - malePercent;

            return (
              <div
                key={ad.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header (Meta Sponsored style) */}
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {ad.pageName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-bold text-xs text-slate-900 leading-tight">
                            {ad.pageName}
                          </h3>
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span>Sponsored</span>
                          <span>•</span>
                          <span className="font-mono">ID: {ad.pageId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      ad.adStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {ad.adStatus}
                    </span>
                  </div>

                  {/* Creative Primary Copy */}
                  <div className="p-4 space-y-3">
                    <div className="relative group">
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {ad.creativeBody1 || 'No primary text in ad payload.'}
                      </p>
                      {ad.creativeBody1 && (
                        <button
                          onClick={() => copyAdText(ad.id, ad.creativeBody1)}
                          className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded text-[10px] flex items-center space-x-1"
                          title="Copy ad primary text"
                        >
                          {copiedId === ad.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === ad.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {/* Visual Media Placeholder Box */}
                    <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-slate-200/80 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors" />
                      
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 mb-2 z-10">
                        {ad.mediaType === 'VIDEO' ? (
                          <Video className="w-6 h-6 text-purple-600" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>

                      <span className="text-xs font-bold text-slate-800 z-10">
                        {ad.mediaType} Creative
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 z-10">
                        {ad.languages ? `Languages: ${ad.languages}` : 'Multi-language ad'}
                      </span>

                      <div className="absolute bottom-2 right-2 flex items-center space-x-1 z-10">
                        {[ad.platform1, ad.platform2, ad.platform3].filter(Boolean).map(p => (
                          <span key={p} className="text-[9px] bg-white/90 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700 shadow-2xs">
                            {p.replace('_NETWORK', '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ad Link Preview Box */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {ad.linkCaption1 || 'ad-destination.com'}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 mt-0.5 line-clamp-2">
                          {ad.linkTitle1 || 'Learn More'}
                        </h4>
                        {ad.linkDescription1 && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                            {ad.linkDescription1}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Metrics & DSA Demographics */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
                  {/* KPI Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Reach</span>
                      <span className="font-black text-slate-800">{ad.totalReach.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Daily Avg</span>
                      <span className="font-black text-slate-800">{Number(ad.avgDailyReach || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Running</span>
                      <span className="font-black text-slate-800">{ad.daysRunning || 1}d</span>
                    </div>
                  </div>

                  {/* Gender Mini-Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                      <span>👨 Men: {malePercent}%</span>
                      <span>👩 Women: {femalePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-rose-200 rounded-full overflow-hidden flex">
                      <div style={{ width: `${malePercent}%` }} className="h-full bg-blue-500" />
                      <div style={{ width: `${femalePercent}%` }} className="h-full bg-rose-400" />
                    </div>
                  </div>

                  {/* Open Snapshot link */}
                  <a
                    href={ad.snapshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>View in Meta Ads Library</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
