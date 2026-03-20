import { BaseNormalizer } from '../../normalizers/base-normalizer';

export class RemoteOKNormalizer extends BaseNormalizer {
  protected normalizeLocation(location: string): string {
    if (!location || location.toLowerCase().includes('anywhere')) {
      return 'Remote - Worldwide';
    }
    return super.normalizeLocation(location);
  }

  protected normalizeWorkMode(workMode?: string): string {
    return 'remote';
  }
}
