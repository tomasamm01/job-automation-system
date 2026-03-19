using JobAutomation.Core.DTOs;
using JobAutomation.Core.Entities;
using JobAutomation.Core.Interfaces;
using JobAutomation.Core.Interfaces.Services;
using JobAutomation.Core.Services;

namespace JobAutomation.Core.UseCases.Jobs;

public class IngestJobsUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IScoringService _scoringService;
    private readonly IMetricsService _metricsService;

    public IngestJobsUseCase(
        IUnitOfWork unitOfWork,
        IScoringService scoringService,
        IMetricsService metricsService)
    {
        _unitOfWork = unitOfWork;
        _scoringService = scoringService;
        _metricsService = metricsService;
    }

    public async Task<IngestResultDto> ExecuteAsync(
        IReadOnlyList<CreateJobDto> jobs,
        CancellationToken cancellationToken = default)
    {
        if (jobs.Count == 0)
        {
            return new IngestResultDto(0, 0, 0, 0, Array.Empty<Guid>(), Array.Empty<IngestErrorDto>());
        }

        var results = new List<IngestItemResult>(jobs.Count);
        var jobsToCreate = new List<(int Index, CreateJobDto Dto, string? NormalizedUrl)>();

        var validationResults = ValidateAll(jobs);
        results.AddRange(validationResults.Where(r => r.Status == IngestStatus.Failed));
        
        var validJobs = validationResults
            .Where(r => r.Status != IngestStatus.Failed)
            .Select(r => (r.Index, jobs[r.Index], UrlNormalizer.Normalize(jobs[r.Index].SourceUrl)))
            .ToList();

        if (validJobs.Count == 0)
        {
            return BuildResult(jobs.Count, results);
        }

        var duplicateResults = await CheckDuplicatesAsync(validJobs, cancellationToken);
        results.AddRange(duplicateResults.Where(r => r.Status == IngestStatus.Duplicate));

        var duplicateIndices = duplicateResults
            .Where(r => r.Status == IngestStatus.Duplicate)
            .Select(r => r.Index)
            .ToHashSet();

        jobsToCreate = validJobs
            .Where(v => !duplicateIndices.Contains(v.Index))
            .ToList();

        if (jobsToCreate.Count == 0)
        {
            return BuildResult(jobs.Count, results);
        }

        var companyCache = await PreloadCompaniesAsync(
            jobsToCreate.Select(j => j.Dto.Company.Name).Distinct(),
            cancellationToken);

        var createdResults = await CreateJobsAsync(jobsToCreate, companyCache, cancellationToken);
        results.AddRange(createdResults);

        var createdCount = createdResults.Count(r => r.Status == IngestStatus.Created);
        if (createdCount > 0)
        {
            await _metricsService.RecordJobIngestedAsync(createdCount, cancellationToken);
        }

        return BuildResult(jobs.Count, results);
    }

    private List<IngestItemResult> ValidateAll(IReadOnlyList<CreateJobDto> jobs)
    {
        var results = new List<IngestItemResult>(jobs.Count);

        for (int i = 0; i < jobs.Count; i++)
        {
            var (isValid, error) = JobValidator.Validate(jobs[i]);
            
            if (!isValid)
            {
                results.Add(new IngestItemResult
                {
                    Index = i,
                    Status = IngestStatus.Failed,
                    Error = error,
                    ExternalId = jobs[i].ExternalId
                });
            }
            else
            {
                results.Add(new IngestItemResult
                {
                    Index = i,
                    Status = IngestStatus.Created,
                    ExternalId = jobs[i].ExternalId
                });
            }
        }

        return results;
    }

    private async Task<List<IngestItemResult>> CheckDuplicatesAsync(
        List<(int Index, CreateJobDto Dto, string? NormalizedUrl)> jobs,
        CancellationToken cancellationToken)
    {
        var results = new List<IngestItemResult>();

        var externalIdCandidates = jobs
            .Where(j => !string.IsNullOrEmpty(j.Dto.ExternalId))
            .Select(j => (j.Dto.ExternalId!, j.Dto.Source))
            .ToList();

        var existingExternalIds = await _unitOfWork.Jobs.GetExistingExternalIdsAsync(
            externalIdCandidates, cancellationToken);

        var urlCandidates = jobs
            .Where(j => !string.IsNullOrEmpty(j.NormalizedUrl))
            .Select(j => j.NormalizedUrl!)
            .ToList();

        var existingUrls = await _unitOfWork.Jobs.GetExistingNormalizedUrlsAsync(
            urlCandidates, cancellationToken);

        var seenExternalIds = new HashSet<string>();
        var seenUrls = new HashSet<string>();

        foreach (var (index, dto, normalizedUrl) in jobs)
        {
            var externalIdKey = !string.IsNullOrEmpty(dto.ExternalId) 
                ? $"{dto.ExternalId}|{dto.Source}" 
                : null;

            if (externalIdKey != null)
            {
                if (existingExternalIds.Contains(externalIdKey) || seenExternalIds.Contains(externalIdKey))
                {
                    results.Add(new IngestItemResult
                    {
                        Index = index,
                        Status = IngestStatus.Duplicate,
                        ExternalId = dto.ExternalId
                    });
                    continue;
                }
                seenExternalIds.Add(externalIdKey);
            }

            if (!string.IsNullOrEmpty(normalizedUrl))
            {
                if (existingUrls.Contains(normalizedUrl) || seenUrls.Contains(normalizedUrl))
                {
                    results.Add(new IngestItemResult
                    {
                        Index = index,
                        Status = IngestStatus.Duplicate,
                        ExternalId = dto.ExternalId
                    });
                    continue;
                }
                seenUrls.Add(normalizedUrl);
            }
        }

        return results;
    }

    private async Task<Dictionary<string, Company>> PreloadCompaniesAsync(
        IEnumerable<string> companyNames,
        CancellationToken cancellationToken)
    {
        var cache = new Dictionary<string, Company>(StringComparer.OrdinalIgnoreCase);

        foreach (var name in companyNames)
        {
            var existing = await _unitOfWork.Companies.GetByNameAsync(name, cancellationToken);
            if (existing != null)
            {
                cache[name] = existing;
            }
        }

        return cache;
    }

    private async Task<List<IngestItemResult>> CreateJobsAsync(
        List<(int Index, CreateJobDto Dto, string? NormalizedUrl)> jobsToCreate,
        Dictionary<string, Company> companyCache,
        CancellationToken cancellationToken)
    {
        var results = new List<IngestItemResult>();

        foreach (var (index, dto, normalizedUrl) in jobsToCreate)
        {
            try
            {
                var company = await GetOrCreateCompanyAsync(dto.Company, companyCache, cancellationToken);

                var job = new Job
                {
                    Id = Guid.NewGuid(),
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim(),
                    Requirements = dto.Requirements?.Trim(),
                    Location = dto.Location?.Trim(),
                    JobType = dto.JobType,
                    WorkMode = dto.WorkMode,
                    SalaryRange = dto.SalaryRange?.Trim(),
                    ExternalId = dto.ExternalId?.Trim(),
                    SourceUrl = dto.SourceUrl?.Trim(),
                    NormalizedUrl = normalizedUrl,
                    Source = dto.Source.Trim(),
                    ExpiresAt = dto.ExpiresAt,
                    CompanyId = company.Id,
                    CreatedAt = DateTime.UtcNow
                };

                job.RelevanceScore = await _scoringService.CalculateRelevanceScoreAsync(job, cancellationToken);

                await _unitOfWork.Jobs.AddAsync(job, cancellationToken);

                results.Add(new IngestItemResult
                {
                    Index = index,
                    Status = IngestStatus.Created,
                    JobId = job.Id,
                    ExternalId = dto.ExternalId
                });
            }
            catch (Exception ex)
            {
                results.Add(new IngestItemResult
                {
                    Index = index,
                    Status = IngestStatus.Failed,
                    Error = $"Failed to create job: {ex.Message}",
                    ExternalId = dto.ExternalId
                });
            }
        }

        if (results.Any(r => r.Status == IngestStatus.Created))
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return results;
    }

    private async Task<Company> GetOrCreateCompanyAsync(
        CreateCompanyDto companyDto,
        Dictionary<string, Company> cache,
        CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(companyDto.Name, out var cached))
            return cached;

        var existing = await _unitOfWork.Companies.GetByNameAsync(companyDto.Name, cancellationToken);
        
        if (existing != null)
        {
            cache[companyDto.Name] = existing;
            return existing;
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = companyDto.Name.Trim(),
            Website = companyDto.Website?.Trim(),
            Industry = companyDto.Industry?.Trim(),
            Location = companyDto.Location?.Trim(),
            LogoUrl = companyDto.LogoUrl?.Trim(),
            Description = companyDto.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Companies.AddAsync(company, cancellationToken);
        cache[companyDto.Name] = company;
        
        return company;
    }

    private static IngestResultDto BuildResult(int totalProcessed, List<IngestItemResult> results)
    {
        var created = results.Where(r => r.Status == IngestStatus.Created).ToList();
        var duplicates = results.Count(r => r.Status == IngestStatus.Duplicate);
        var failed = results.Where(r => r.Status == IngestStatus.Failed).ToList();

        return new IngestResultDto(
            Processed: totalProcessed,
            Created: created.Count,
            Duplicates: duplicates,
            Failed: failed.Count,
            CreatedIds: created.Where(c => c.JobId.HasValue).Select(c => c.JobId!.Value).ToList(),
            Errors: failed.Select(f => new IngestErrorDto(f.Index, f.ExternalId, f.Error ?? "Unknown error")).ToList()
        );
    }
}
