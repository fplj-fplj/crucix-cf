import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

export async function fetchCisaKevData(): Promise<SourceResult> {
  try {
    const result = await safeFetchJSON<any>(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      undefined,
      20_000,
    );

    const vulns = result.vulnerabilities ?? [];
    const totalVulnerabilities = vulns.length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentAdditions = vulns
      .filter((v: any) => new Date(v.dateAdded).getTime() > thirtyDaysAgo)
      .sort((a: any, b: any) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 50)
      .map((v: any) => ({
        cveID: v.cveID ?? '',
        vendorProject: v.vendorProject ?? '',
        product: v.product ?? '',
        vulnerabilityName: v.vulnerabilityName ?? '',
        dateAdded: v.dateAdded ?? '',
        shortDescription: v.shortDescription ?? '',
      }));

    const vendorMap = new Map<string, number>();
    for (const v of vulns) {
      const vendor = v.vendorProject || 'Unknown';
      vendorMap.set(vendor, (vendorMap.get(vendor) ?? 0) + 1);
    }
    const byVendor = Array.from(vendorMap.entries())
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    const ransomwareRelated = vulns.filter(
      (v: any) =>
        v.knownRansomwareCampaignUse === 'Known' ||
        v.knownRansomwareCampaignUse === 'Yes' ||
        (v.shortDescription ?? '').toLowerCase().includes('ransomware'),
    ).length;

    return {
      name: 'cisa-kev', source: 'cisa-kev',
      success: true,
      data: { totalVulnerabilities, recentAdditions, byVendor, ransomwareRelated },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'cisa-kev', source: 'cisa-kev',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
