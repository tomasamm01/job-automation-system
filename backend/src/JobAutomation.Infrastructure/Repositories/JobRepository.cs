using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Interfaces.Repositories;
using JobAutomation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Infrastructure.Repositories;

public class JobRepository : Repository<Job>, IJobRepository
{
    public JobRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Job>> GetJobsWithFiltersAsync(
        string? keyword = null,
        JobType? jobType = null,
        WorkMode? workMode = null,
        string? location = null,
        JobStatus? status = null,
        double? minRelevanceScore = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(j => j.Company)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            query = query.Where(j =>
                j.Title.ToLower().Contains(lowerKeyword) ||
                (j.Description != null && j.Description.ToLower().Contains(lowerKeyword)) ||
                j.Company.Name.ToLower().Contains(lowerKeyword));
        }

        if (jobType.HasValue)
            query = query.Where(j => j.JobType == jobType.Value);

        if (workMode.HasValue)
            query = query.Where(j => j.WorkMode == workMode.Value);

        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(j => j.Location != null && j.Location.ToLower().Contains(location.ToLower()));

        if (status.HasValue)
            query = query.Where(j => j.Status == status.Value);

        if (minRelevanceScore.HasValue)
            query = query.Where(j => j.RelevanceScore >= minRelevanceScore.Value);

        return await query
            .OrderByDescending(j => j.RelevanceScore)
            .ThenByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<Job?> GetByExternalIdAsync(
        string externalId,
        string source,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(externalId))
            return null;

        return await _dbSet
            .FirstOrDefaultAsync(j => j.ExternalId == externalId && j.Source == source, cancellationToken);
    }

    public async Task<Job?> GetWithCompanyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Job>> GetRecentJobsAsync(int count, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(j => j.Company)
            .OrderByDescending(j => j.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTotalCountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.CountAsync(cancellationToken);
    }

    public async Task<Job?> GetByNormalizedUrlAsync(
        string normalizedUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(normalizedUrl))
            return null;

        return await _dbSet
            .FirstOrDefaultAsync(j => j.NormalizedUrl == normalizedUrl, cancellationToken);
    }

    public async Task<HashSet<string>> GetExistingExternalIdsAsync(
        IEnumerable<(string ExternalId, string Source)> candidates,
        CancellationToken cancellationToken = default)
    {
        var candidateList = candidates
            .Where(c => !string.IsNullOrEmpty(c.ExternalId))
            .ToList();

        if (candidateList.Count == 0)
            return new HashSet<string>();

        var externalIds = candidateList.Select(c => c.ExternalId).ToList();
        var sources = candidateList.Select(c => c.Source).Distinct().ToList();

        var existingJobs = await _dbSet
            .Where(j => j.ExternalId != null 
                        && externalIds.Contains(j.ExternalId) 
                        && sources.Contains(j.Source))
            .Select(j => new { j.ExternalId, j.Source })
            .ToListAsync(cancellationToken);

        return existingJobs
            .Select(j => $"{j.ExternalId}|{j.Source}")
            .ToHashSet();
    }

    public async Task<HashSet<string>> GetExistingNormalizedUrlsAsync(
        IEnumerable<string> normalizedUrls,
        CancellationToken cancellationToken = default)
    {
        var urlList = normalizedUrls
            .Where(u => !string.IsNullOrEmpty(u))
            .Distinct()
            .ToList();

        if (urlList.Count == 0)
            return new HashSet<string>();

        var existingUrls = await _dbSet
            .Where(j => j.NormalizedUrl != null && urlList.Contains(j.NormalizedUrl))
            .Select(j => j.NormalizedUrl!)
            .ToListAsync(cancellationToken);

        return existingUrls.ToHashSet();
    }
}
