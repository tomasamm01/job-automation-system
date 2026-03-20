import { IJobNormalizer } from '../types/interfaces';
import { JobRaw, JobNormalized } from '../types';

export abstract class BaseNormalizer implements IJobNormalizer {
  normalize(raw: JobRaw): JobNormalized {
    return {
      externalId: this.normalizeExternalId(raw.externalId),
      source: raw.source,
      title: this.normalizeTitle(raw.title),
      company: this.normalizeCompany(raw.company),
      location: this.normalizeLocation(raw.location),
      url: this.normalizeUrl(raw.url),
      description: this.normalizeDescription(raw.description),
      salaryMin: raw.salaryMin ?? null,
      salaryMax: raw.salaryMax ?? null,
      workMode: this.normalizeWorkMode(raw.workMode),
      jobType: this.normalizeJobType(raw.jobType),
    };
  }

  validateJob(job: JobNormalized): boolean {
    if (!job.externalId || job.externalId.trim() === '') return false;
    if (!job.source || job.source.trim() === '') return false;
    if (!job.title || job.title.trim() === '') return false;
    if (!job.company || job.company.trim() === '') return false;
    if (!job.url || !this.isValidUrl(job.url)) return false;
    if (!job.description || job.description.trim() === '') return false;
    
    return true;
  }

  protected normalizeExternalId(id: string): string {
    return id.trim();
  }

  protected normalizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  protected normalizeCompany(company: string): string {
    return company.trim().replace(/\s+/g, ' ');
  }

  protected normalizeLocation(location: string): string {
    return location.trim().replace(/\s+/g, ' ');
  }

  protected normalizeUrl(url: string): string {
    return url.trim();
  }

  protected normalizeDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }

  protected normalizeWorkMode(workMode?: string): string {
    if (!workMode) return 'unknown';
    
    const mode = workMode.toLowerCase().trim();
    
    if (mode.includes('remote') || mode.includes('remoto')) return 'remote';
    if (mode.includes('hybrid') || mode.includes('híbrido')) return 'hybrid';
    if (mode.includes('onsite') || mode.includes('presencial') || mode.includes('on-site')) return 'onsite';
    
    return 'unknown';
  }

  protected normalizeJobType(jobType?: string): string {
    if (!jobType) return 'unknown';
    
    const type = jobType.toLowerCase().trim();
    
    if (type.includes('full') || type.includes('tiempo completo')) return 'full-time';
    if (type.includes('part') || type.includes('medio tiempo')) return 'part-time';
    if (type.includes('contract') || type.includes('contrato')) return 'contract';
    if (type.includes('freelance') || type.includes('independiente')) return 'freelance';
    if (type.includes('intern') || type.includes('pasantía')) return 'internship';
    
    return 'unknown';
  }

  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
