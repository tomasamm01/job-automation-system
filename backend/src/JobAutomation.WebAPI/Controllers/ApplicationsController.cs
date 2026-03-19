using JobAutomation.Core.DTOs;
using JobAutomation.Core.DTOs.Common;
using JobAutomation.Core.Enums;
using JobAutomation.Core.UseCases.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAutomation.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly GetApplicationsUseCase _getApplicationsUseCase;
    private readonly ApplyToJobUseCase _applyToJobUseCase;
    private readonly UpdateApplicationStatusUseCase _updateStatusUseCase;

    public ApplicationsController(
        GetApplicationsUseCase getApplicationsUseCase,
        ApplyToJobUseCase applyToJobUseCase,
        UpdateApplicationStatusUseCase updateStatusUseCase)
    {
        _getApplicationsUseCase = getApplicationsUseCase;
        _applyToJobUseCase = applyToJobUseCase;
        _updateStatusUseCase = updateStatusUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ApplicationListDto>>>> GetApplications(
        [FromQuery] ApplicationStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var applications = await _getApplicationsUseCase.ExecuteAsync(status, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ApplicationListDto>>.Ok(applications));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ApplicationDto>>> GetApplication(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var application = await _getApplicationsUseCase.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<ApplicationDto>.Ok(application));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ApplicationDto>>> ApplyToJob(
        [FromBody] CreateApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        var application = await _applyToJobUseCase.ExecuteAsync(dto, cancellationToken);
        return CreatedAtAction(
            nameof(GetApplication),
            new { id = application.Id },
            ApiResponse<ApplicationDto>.Ok(application, "Application submitted successfully"));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<ApplicationDto>>> UpdateStatus(
        Guid id,
        [FromBody] UpdateApplicationStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var application = await _updateStatusUseCase.ExecuteAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<ApplicationDto>.Ok(application, "Application status updated"));
    }
}
