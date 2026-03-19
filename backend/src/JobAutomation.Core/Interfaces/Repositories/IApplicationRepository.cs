using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Interfaces.Repositories;

public interface IApplicationRepository : IRepository<Application>
{
    Task<IEnumerable<Application>> GetByStatusAsync(ApplicationStatus status, CancellationToken cancellationToken = default);
    Task<Application?> GetWithJobAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Application>> GetByJobIdAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<bool> HasAppliedToJobAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Application>> GetRecentApplicationsAsync(int count, CancellationToken cancellationToken = default);
}
