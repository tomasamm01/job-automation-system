import { BaseNormalizer } from '../../normalizers/base-normalizer';

export class GetOnBoardNormalizer extends BaseNormalizer {
  protected normalizeLocation(location: string): string {
    const cleaned = super.normalizeLocation(location);
    
    if (cleaned.toLowerCase().includes('latam') || cleaned.toLowerCase().includes('latinoamérica')) {
      return 'Remote - Latin America';
    }
    
    return cleaned;
  }
}
