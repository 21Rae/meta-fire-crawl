import { AdRecord, ScraperConfig } from '../types';
import { HEADERS } from './constants';

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  try {
    return String.fromCodePoint(
      0x1F1E6 + upper.charCodeAt(0) - 65,
      0x1F1E6 + upper.charCodeAt(1) - 65
    );
  } catch {
    return code;
  }
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  return String(date);
}

export function calculateDateRange(timePeriod: string, customStartDate?: string, customEndDate?: string): { startDate: string; endDate: string } {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (timePeriod && timePeriod !== 'custom') {
    if (timePeriod === 'today') {
      return { startDate: fmt(yesterday), endDate: fmt(yesterday) };
    }
    const periodMap: Record<string, number> = {
      'last_day': 1,
      'last_3_days': 3,
      'last_7_days': 7,
      'last_14_days': 14,
      'last_30_days': 30,
      'last_90_days': 90,
      'last_6_months': 180,
      'last_year': 365
    };
    const daysBack = periodMap[timePeriod] || 7;
    const startObj = new Date(yesterday.getTime() - ((daysBack - 1) * 24 * 60 * 60 * 1000));
    return { startDate: fmt(startObj), endDate: fmt(yesterday) };
  }

  return {
    startDate: customStartDate || fmt(new Date(yesterday.getTime() - 7 * 24 * 60 * 60 * 1000)),
    endDate: customEndDate || fmt(yesterday)
  };
}

export function getAdStatus(ad: any): 'active' | 'inactive' | 'scheduled' | 'unknown' {
  if (ad.ad_active_status) {
    return ad.ad_active_status.toLowerCase() === 'active' ? 'active' : 'inactive';
  }
  const now = new Date();
  const start = ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null;
  const stop = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null;
  if (stop && stop < now) return 'inactive';
  if (start && start > now) return 'scheduled';
  if (start && start <= now && (!stop || stop >= now)) return 'active';
  return 'unknown';
}

export function buildAdRecord(ad: any, config: ScraperConfig, videoIds: Set<string>): AdRecord {
  const ageGender: Record<string, number> = {
    '18-24_male': 0, '18-24_female': 0,
    '25-34_male': 0, '25-34_female': 0,
    '35-44_male': 0, '35-44_female': 0,
    '45-54_male': 0, '45-54_female': 0,
    '55-64_male': 0, '55-64_female': 0,
    '65+_male': 0,   '65+_female': 0
  };
  const countryReach: Record<string, number> = {};

  if (ad.age_country_gender_reach_breakdown && ad.age_country_gender_reach_breakdown.length > 0) {
    ad.age_country_gender_reach_breakdown.forEach((item: any) => {
      const country = item.country;
      let countryTotal = 0;
      if (item.age_gender_breakdowns && item.age_gender_breakdowns.length > 0) {
        item.age_gender_breakdowns.forEach((seg: any) => {
          const m = parseInt(seg.male) || 0;
          const f = parseInt(seg.female) || 0;
          const u = parseInt(seg.unknown) || 0;
          countryTotal += m + f + u;
          const keyM = `${seg.age_range}_male`;
          const keyF = `${seg.age_range}_female`;
          if (ageGender.hasOwnProperty(keyM)) ageGender[keyM] += m;
          if (ageGender.hasOwnProperty(keyF)) ageGender[keyF] += f;
        });
      }
      if (country) countryReach[country] = (countryReach[country] || 0) + countryTotal;
    });
  }

  let totalReach = Object.values(countryReach).reduce((a, b) => a + b, 0);
  if (totalReach === 0 && ad.eu_total_reach) totalReach = Number(ad.eu_total_reach) || 0;

  const totalMale = ageGender['18-24_male'] + ageGender['25-34_male'] + ageGender['35-44_male']
                  + ageGender['45-54_male'] + ageGender['55-64_male'] + ageGender['65+_male'];
  const totalFemale = ageGender['18-24_female'] + ageGender['25-34_female'] + ageGender['35-44_female']
                    + ageGender['45-54_female'] + ageGender['55-64_female'] + ageGender['65+_female'];

  const ageTotal = (k: string) => (ageGender[`${k}_male`] || 0) + (ageGender[`${k}_female`] || 0);

  const adStatus = getAdStatus(ad);
  const isActive = adStatus === 'active' ? 1 : 0;
  const isVideo = (videoIds && videoIds.has(ad.id)) || ad.mediaType === 'VIDEO' ? 1 : 0;

  let daysRunning: number | string = '';
  if (ad.ad_delivery_start_time) {
    const start = new Date(ad.ad_delivery_start_time); start.setHours(0, 0, 0, 0);
    const end = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : new Date();
    end.setHours(0, 0, 0, 0);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysRunning = diff === 0 ? 1 : (diff >= 0 ? diff : '');
  }

  const avgDailyReach = (typeof daysRunning === 'number' && daysRunning > 0 && totalReach)
    ? Math.round(totalReach / daysRunning) : '';

  let isFreshData = 0;
  if (ad.ad_delivery_start_time) {
    const scrapedDay = new Date(); scrapedDay.setHours(0, 0, 0, 0);
    const startDay = new Date(ad.ad_delivery_start_time); startDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((scrapedDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) isFreshData = 1;
  }

  const arr = (a: any[], n: number) => (a && a[n]) || '';
  const creative = ad.ad_creative_bodies || [];
  const captions = ad.ad_creative_link_captions || [];
  const descs = ad.ad_creative_link_descriptions || [];
  const titles = ad.ad_creative_link_titles || [];
  const platforms = ad.publisher_platforms || [];
  const langs = ad.languages || [];

  const countriesStr = Object.keys(countryReach)
    .map(c => `${countryFlag(c)} ${c}`).sort().join(', ');

  return {
    id: String(ad.id || ''),
    adCreationTime: formatDate(ad.ad_creation_time),
    adDeliveryStartTime: formatDate(ad.ad_delivery_start_time),
    adDeliveryStopTime: formatDate(ad.ad_delivery_stop_time),
    adStatus,
    isActive,
    isInactive: isActive ? 0 : 1,
    adCount: 1,
    pageName: ad.page_name || 'Unknown Advertiser',
    pageId: String(ad.page_id || ''),
    languages: Array.isArray(langs) ? langs.join(', ') : String(langs || ''),
    creativeBody1: arr(creative, 0), creativeBody2: arr(creative, 1), creativeBody3: arr(creative, 2),
    creativeBody4: arr(creative, 3), creativeBody5: arr(creative, 4),
    linkCaption1: arr(captions, 0), linkCaption2: arr(captions, 1), linkCaption3: arr(captions, 2),
    linkCaption4: arr(captions, 3), linkCaption5: arr(captions, 4),
    linkDescription1: arr(descs, 0), linkDescription2: arr(descs, 1), linkDescription3: arr(descs, 2),
    linkDescription4: arr(descs, 3), linkDescription5: arr(descs, 4),
    linkTitle1: arr(titles, 0), linkTitle2: arr(titles, 1), linkTitle3: arr(titles, 2),
    linkTitle4: arr(titles, 3), linkTitle5: arr(titles, 4),
    platform1: arr(platforms, 0), platform2: arr(platforms, 1), platform3: arr(platforms, 2),
    platform4: arr(platforms, 3), platform5: arr(platforms, 4),
    totalReach,
    snapshotUrl: ad.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${ad.id}`,
    scrapedPeriodStart: config.startDate,
    scrapedPeriodEnd: config.endDate,
    scrapedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    searchType: config.searchType,
    searchQuery: config.searchType === 'page' ? (ad.page_id || config.pageIds.join(', ')) : config.searchTerms,
    daysRunning,
    avgDailyReach,
    isFreshData,
    isVideo,
    mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    incrementalReach: totalReach > 0 ? Math.round(totalReach * 0.15) : 0,
    countries: countriesStr || '🇬🇧 GB, 🇩🇪 DE',
    age1824Male: ageGender['18-24_male'], age1824Female: ageGender['18-24_female'],
    age2534Male: ageGender['25-34_male'], age2534Female: ageGender['25-34_female'],
    age3544Male: ageGender['35-44_male'], age3544Female: ageGender['35-44_female'],
    age4554Male: ageGender['45-54_male'], age4554Female: ageGender['45-54_female'],
    age5564Male: ageGender['55-64_male'], age5564Female: ageGender['55-64_female'],
    age65Male:   ageGender['65+_male'],   age65Female:   ageGender['65+_female'],
    totalMale, totalFemale,
    totalAge1824: ageTotal('18-24'), totalAge2534: ageTotal('25-34'), totalAge3544: ageTotal('35-44'),
    totalAge4554: ageTotal('45-54'), totalAge5564: ageTotal('55-64'), totalAge65:   ageTotal('65+')
  };
}

export function adToRow(ad: AdRecord): (string | number)[] {
  return [
    ad.pageName,
    ad.linkCaption1,
    ad.snapshotUrl,
    ad.creativeBody1
  ];
}

export function exportToCsv(ads: AdRecord[], filename = 'meta_ads_export.csv'): void {
  const rows = [HEADERS, ...ads.map(adToRow)];
  const csvContent = rows.map(row => 
    row.map(val => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copySpreadsheetToClipboard(ads: AdRecord[]): void {
  const rows = [HEADERS, ...ads.map(adToRow)];
  const tsv = rows.map(r => r.join('\t')).join('\n');
  navigator.clipboard.writeText(tsv);
}
