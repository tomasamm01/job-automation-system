import { BaseNormalizer } from '../../normalizers/base-normalizer';

export class LinkedInNormalizer extends BaseNormalizer {
  protected normalizeLocation(location: string): string {
    const cleaned = super.normalizeLocation(location);
    
    if (cleaned.includes('United States')) {
      return cleaned.replace('United States', 'USA');
    }
    
    return cleaned;
  }

  protected normalizeWorkMode(workMode?: string): string {
    if (!workMode) return 'unknown';
    
    const mode = workMode.toLowerCase();
    
    if (mode.includes('remote')) return 'remote';
    if (mode.includes('hybrid')) return 'hybrid';
    if (mode.includes('on-site') || mode.includes('on site')) return 'onsite';
    
    return super.normalizeWorkMode(workMode);
  }
}
