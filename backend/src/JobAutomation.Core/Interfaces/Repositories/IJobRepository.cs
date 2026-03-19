using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Interfaces.Repositories;

public interface IJobRepository : IRepository<Job>
{
    Task<IEnumerable<Job>> GetJobsWithFiltersAsync(
        string? keyword = null,
        JobType? jobType = null,
        WorkMode? workMode = null,
        string? location = null,
        JobStatus? status = null,
        double? minRelevanceScore = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<Job?> GetByExternalIdAsync(string externalId, string source, CancellationToken cancellationToken = default);
    Task<Job?> GetByNormalizedUrlAsync(string normalizedUrl, CancellationToken cancellationToken = default);
    Task<Job?> GetWithCompanyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Job>> GetRecentJobsAsync(int count, CancellationToken cancellationToken = default);
    Task<int> GetTotalCountAsync(CancellationToken cancellationToken = default);
    
    Task<HashSet<string>> GetExistingExternalIdsAsync(
        IEnumerable<(string ExternalId, string Source)> candidates, 
        CancellationToken cancellationToken = default);
    
    Task<HashSet<string>> GetExistingNormalizedUrlsAsync(
        IEnumerable<string> normalizedUrls, 
        CancellationToken cancellationToken = default);
}
