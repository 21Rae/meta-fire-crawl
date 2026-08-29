import { AdRecord, ExtractedEmailResult, SortedMailLead } from '../types';
import { getCleanDomainOrUrl } from './urlFilters';

/**
 * Checks if an email address is a 'contact' or 'info' address.
 * Strictly matches prefixes like contact@, info@, contact-us@, information@, etc.
 * and rejects everything else (support, sales, personal names, etc.).
 */
export function isContactOrInfoEmail(rawEmail: string): { isMatch: boolean; type: 'contact' | 'info' | null } {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isMatch: false, type: null };
  }

  const clean = rawEmail.trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx === -1) {
    return { isMatch: false, type: null };
  }

  const username = clean.substring(0, atIdx);

  // Check for contact variations
  const isContact = (
    username === 'contact' ||
    username === 'contactus' ||
    username === 'contact-us' ||
    username === 'contact_us' ||
    username === 'contactme' ||
    username === 'contact.us' ||
    username.startsWith('contact.') ||
    username.startsWith('contact_') ||
    username.startsWith('contact-')
  );

  if (isContact) {
    return { isMatch: true, type: 'contact' };
  }

  // Check for info variations
  const isInfo = (
    username === 'info' ||
    username === 'information' ||
    username === 'infodesk' ||
    username === 'info-us' ||
    username === 'info_us' ||
    username.startsWith('info.') ||
    username.startsWith('info_') ||
    username.startsWith('info-')
  );

  if (isInfo) {
    return { isMatch: true, type: 'info' };
  }

  return { isMatch: false, type: null };
}

/**
 * Sorts all emails across ads and extracted map results.
 * Only returns emails that are 'contact' or 'info' and drops the rest.
 * Outputs sorted, deduplicated records with business name and email ready for export.
 */
export function sortMail(
  ads: AdRecord[], 
  extractedMap: Record<string, ExtractedEmailResult> = {}
): SortedMailLead[] {
  const map = new Map<string, SortedMailLead>();

  // 1. Gather from extractedMap (from Firecrawl live extraction)
  Object.values(extractedMap).forEach(item => {
    const businessName = (item.pageName || 'Unknown Business').trim();
    const originalLink = (item.originalLink || item.url || '').trim();
    const domain = getCleanDomainOrUrl(originalLink);

    if (item.emails && Array.isArray(item.emails)) {
      item.emails.forEach(rawEmail => {
        const check = isContactOrInfoEmail(rawEmail);
        if (check.isMatch && check.type) {
          const email = rawEmail.trim().toLowerCase();
          const key = `${businessName.toLowerCase()}:::${email}`;

          if (!map.has(key)) {
            map.set(key, {
              businessName,
              email,
              emailType: check.type,
              domain,
              originalLink,
              adCount: 1
            });
          }
        }
      });
    }
  });

  // 2. Gather from ads (if ad.extractedEmails exists)
  ads.forEach(ad => {
    const businessName = (ad.pageName || 'Unknown Business').trim();
    const originalLink = (ad.linkCaption1 || '').trim();
    const domain = getCleanDomainOrUrl(originalLink);

    if (ad.extractedEmails && Array.isArray(ad.extractedEmails)) {
      ad.extractedEmails.forEach(rawEmail => {
        const check = isContactOrInfoEmail(rawEmail);
        if (check.isMatch && check.type) {
          const email = rawEmail.trim().toLowerCase();
          const key = `${businessName.toLowerCase()}:::${email}`;

          if (!map.has(key)) {
            map.set(key, {
              businessName,
              email,
              emailType: check.type,
              domain,
              originalLink,
              adCount: 1
            });
          } else {
            const existing = map.get(key)!;
            existing.adCount += 1;
          }
        }
      });
    }
  });

  // Convert to array and sort alphabetically by Business Name (A-Z), then by Email
  const sortedLeads = Array.from(map.values()).sort((a, b) => {
    const nameComp = a.businessName.localeCompare(b.businessName, undefined, { sensitivity: 'base' });
    if (nameComp !== 0) return nameComp;
    return a.email.localeCompare(b.email, undefined, { sensitivity: 'base' });
  });

  return sortedLeads;
}

/**
 * Exports sorted leads to CSV
 * Supports:
 * - 'two-column': "Business Name, Email" (minimal clean export)
 * - 'full': "Business Name, Email, Email Type, Domain, Link Caption, Ad Count"
 */
export function exportSortedMailCsv(
  leads: SortedMailLead[], 
  format: 'two-column' | 'full' = 'two-column',
  filenamePrefix = 'sorted_contact_info_leads'
) {
  if (leads.length === 0) return;

  const rows: string[][] = [];

  if (format === 'two-column') {
    rows.push(['Business Name', 'Email']);
    leads.forEach(lead => {
      rows.push([
        `"${lead.businessName.replace(/"/g, '""')}"`,
        `"${lead.email.replace(/"/g, '""')}"`
      ]);
    });
  } else {
    rows.push(['Business Name', 'Email', 'Email Type', 'Domain', 'Link Caption', 'Ad Count']);
    leads.forEach(lead => {
      rows.push([
        `"${lead.businessName.replace(/"/g, '""')}"`,
        `"${lead.email.replace(/"/g, '""')}"`,
        `"${lead.emailType.toUpperCase()}"`,
        `"${lead.domain.replace(/"/g, '""')}"`,
        `"${lead.originalLink.replace(/"/g, '""')}"`,
        `${lead.adCount}`
      ]);
    });
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filenamePrefix}_${format}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
