using JobAutomation.Core.DTOs;
using JobAutomation.Core.DTOs.Common;
using JobAutomation.Core.UseCases.Metrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAutomation.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly GetMetricsUseCase _getMetricsUseCase;

    public MetricsController(GetMetricsUseCase getMetricsUseCase)
    {
        _getMetricsUseCase = getMetricsUseCase;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardMetricsDto>>> GetDashboardMetrics(
        CancellationToken cancellationToken = default)
    {
        var metrics = await _getMetricsUseCase.ExecuteAsync(cancellationToken);
        return Ok(ApiResponse<DashboardMetricsDto>.Ok(metrics));
    }
}
