import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Users, 
  Eye, 
  TrendingUp, 
  Video, 
  Award, 
  Globe,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { AdRecord } from '../types';

interface AnalyticsDashboardProps {
  ads: AdRecord[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ ads }) => {
  // Aggregate KPIs
  const stats = useMemo(() => {
    if (ads.length === 0) {
      return {
        totalAds: 0,
        totalReach: 0,
        avgDailyReach: 0,
        activeRate: 0,
        videoRate: 0,
        totalMale: 0,
        totalFemale: 0
      };
    }

    const totalReach = ads.reduce((sum, a) => sum + (Number(a.totalReach) || 0), 0);
    const totalDaily = ads.reduce((sum, a) => sum + (Number(a.avgDailyReach) || 0), 0);
    const activeCount = ads.filter(a => a.adStatus === 'active').length;
    const videoCount = ads.filter(a => a.isVideo === 1 || a.mediaType === 'VIDEO').length;
    const totalMale = ads.reduce((sum, a) => sum + (Number(a.totalMale) || 0), 0);
    const totalFemale = ads.reduce((sum, a) => sum + (Number(a.totalFemale) || 0), 0);

    return {
      totalAds: ads.length,
      totalReach,
      avgDailyReach: Math.round(totalDaily / ads.length),
      activeRate: Math.round((activeCount / ads.length) * 100),
      videoRate: Math.round((videoCount / ads.length) * 100),
      totalMale,
      totalFemale
    };
  }, [ads]);

  // Demographics: Age x Gender Chart Data
  const ageGenderData = useMemo(() => {
    const groups = [
      { key: '1824', label: '18-24' },
      { key: '2534', label: '25-34' },
      { key: '3544', label: '35-44' },
      { key: '4554', label: '45-54' },
      { key: '5564', label: '55-64' },
      { key: '65',   label: '65+' }
    ];

    return groups.map(g => {
      const male = ads.reduce((sum, a) => sum + (Number((a as any)[`age${g.key}Male`]) || 0), 0);
      const female = ads.reduce((sum, a) => sum + (Number((a as any)[`age${g.key}Female`]) || 0), 0);
      return {
        age: g.label,
        Male: male,
        Female: female,
        Total: male + female
      };
    });
  }, [ads]);

  // Brand / Page Reach Breakdown
  const brandReachData = useMemo(() => {
    const map: Record<string, number> = {};
    ads.forEach(a => {
      const name = a.pageName || 'Unknown';
      map[name] = (map[name] || 0) + (Number(a.totalReach) || 0);
    });

    return Object.entries(map)
      .map(([name, reach]) => ({ name, reach }))
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 8);
  }, [ads]);

  // Media Format Share
  const mediaTypeData = useMemo(() => {
    const video = ads.filter(a => a.mediaType === 'VIDEO').length;
    const image = ads.filter(a => a.mediaType === 'IMAGE').length;
    const meme = ads.filter(a => a.mediaType === 'MEME').length;
    return [
      { name: 'Video', value: video, color: '#8b5cf6' },
      { name: 'Static Image', value: image, color: '#3b82f6' },
      { name: 'Meme / Overlay', value: meme, color: '#ec4899' },
    ].filter(d => d.value > 0);
  }, [ads]);

  // Platform Share
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {
      Facebook: 0,
      Instagram: 0,
      Messenger: 0,
      'Audience Network': 0,
      Threads: 0
    };

    ads.forEach(ad => {
      const plats = [ad.platform1, ad.platform2, ad.platform3, ad.platform4, ad.platform5].filter(Boolean);
      plats.forEach(p => {
        if (p.includes('FACEBOOK')) counts.Facebook++;
        if (p.includes('INSTAGRAM')) counts.Instagram++;
        if (p.includes('MESSENGER')) counts.Messenger++;
        if (p.includes('AUDIENCE')) counts['Audience Network']++;
        if (p.includes('THREADS')) counts.Threads++;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .filter(d => d.count > 0);
  }, [ads]);

  if (ads.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center bg-white rounded-xl border border-slate-200 mt-6">
        <h3 className="font-bold text-slate-800 text-base">No Data Available For Analytics</h3>
        <p className="text-xs text-slate-500 mt-1">
          Scrape or load ads first to view reach & demographic breakdowns.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reach */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Scraped Reach</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalReach.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">DSA European Union & UK</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Daily Reach */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Daily Reach / Ad</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.avgDailyReach.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Across {stats.totalAds} campaigns</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Active Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Active Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {stats.activeRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Currently active delivery</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Video Share */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Creative Share</span>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {stats.videoRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Motion video vs static</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Demographics Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Age & Gender Reach Breakdown (DSA Compliance)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated demographic impressions across all European Union and UK ad deliveries.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center text-blue-600">
              <span className="w-3 h-3 bg-blue-500 rounded mr-1.5 inline-block" /> Male ({stats.totalMale.toLocaleString()})
            </span>
            <span className="flex items-center text-rose-600">
              <span className="w-3 h-3 bg-rose-400 rounded mr-1.5 inline-block" /> Female ({stats.totalFemale.toLocaleString()})
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageGenderData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip 
                formatter={(value: any) => [Number(value).toLocaleString(), '']}
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend />
              <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Female" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands / Pages Reach */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top Advertisers by Total Reach</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandReachData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                <Tooltip 
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Total Reach']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="reach" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Media Formats & Platforms */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-purple-600" />
            <span>Creative Media Format Distribution</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mediaTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mediaTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`${val} Ads`, '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {mediaTypeData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{item.value} ads</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
