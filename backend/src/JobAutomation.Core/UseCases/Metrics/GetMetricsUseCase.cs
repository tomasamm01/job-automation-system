using JobAutomation.Core.DTOs;
using JobAutomation.Core.Interfaces.Services;

namespace JobAutomation.Core.UseCases.Metrics;

public class GetMetricsUseCase
{
    private readonly IMetricsService _metricsService;

    public GetMetricsUseCase(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    public async Task<DashboardMetricsDto> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        return await _metricsService.GetDashboardMetricsAsync(cancellationToken);
    }
}
