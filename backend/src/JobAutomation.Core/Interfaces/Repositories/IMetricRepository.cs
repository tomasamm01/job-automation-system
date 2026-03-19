using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Interfaces.Repositories;

public interface IMetricRepository : IRepository<Metric>
{
    Task<IEnumerable<Metric>> GetByTypeAsync(MetricType type, CancellationToken cancellationToken = default);
    Task<IEnumerable<Metric>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default);
    Task<Metric?> GetLatestByTypeAsync(MetricType type, CancellationToken cancellationToken = default);
}
