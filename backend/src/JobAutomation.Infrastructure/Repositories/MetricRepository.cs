using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Interfaces.Repositories;
using JobAutomation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Infrastructure.Repositories;

public class MetricRepository : Repository<Metric>, IMetricRepository
{
    public MetricRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Metric>> GetByTypeAsync(
        MetricType type,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.Type == type)
            .OrderByDescending(m => m.RecordedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Metric>> GetByDateRangeAsync(
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.RecordedAt >= from && m.RecordedAt <= to)
            .OrderByDescending(m => m.RecordedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Metric?> GetLatestByTypeAsync(
        MetricType type,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.Type == type)
            .OrderByDescending(m => m.RecordedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
