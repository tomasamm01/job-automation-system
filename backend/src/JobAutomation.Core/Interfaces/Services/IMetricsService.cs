using JobAutomation.Core.DTOs;

namespace JobAutomation.Core.Interfaces.Services;

public interface IMetricsService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
    Task RecordJobIngestedAsync(int count, CancellationToken cancellationToken = default);
    Task RecordApplicationSentAsync(CancellationToken cancellationToken = default);
    Task UpdateRatesAsync(CancellationToken cancellationToken = default);
}
