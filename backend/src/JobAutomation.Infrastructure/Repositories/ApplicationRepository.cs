using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Interfaces.Repositories;
using JobAutomation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Infrastructure.Repositories;

public class ApplicationRepository : Repository<Application>, IApplicationRepository
{
    public ApplicationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Application>> GetByStatusAsync(
        ApplicationStatus status,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.Status == status)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Application?> GetWithJobAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Application>> GetByJobIdAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.JobId == jobId)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasAppliedToJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(a => a.JobId == jobId, cancellationToken);
    }

    public async Task<IEnumerable<Application>> GetRecentApplicationsAsync(
        int count,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .OrderByDescending(a => a.AppliedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }
}
