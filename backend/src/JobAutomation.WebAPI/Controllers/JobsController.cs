using JobAutomation.Core.DTOs;
using JobAutomation.Core.DTOs.Common;
using JobAutomation.Core.Enums;
using JobAutomation.Core.UseCases.Jobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAutomation.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly GetJobsUseCase _getJobsUseCase;
    private readonly IngestJobsUseCase _ingestJobsUseCase;

    public JobsController(GetJobsUseCase getJobsUseCase, IngestJobsUseCase ingestJobsUseCase)
    {
        _getJobsUseCase = getJobsUseCase;
        _ingestJobsUseCase = ingestJobsUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<JobListDto>>>> GetJobs(
        [FromQuery] string? keyword = null,
        [FromQuery] JobType? jobType = null,
        [FromQuery] WorkMode? workMode = null,
        [FromQuery] string? location = null,
        [FromQuery] JobStatus? status = null,
        [FromQuery] double? minRelevanceScore = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var filter = new JobFilterDto(
            keyword, jobType, workMode, location, status, minRelevanceScore, page, pageSize);

        var result = await _getJobsUseCase.ExecuteAsync(filter, cancellationToken);
        return Ok(ApiResponse<PagedResult<JobListDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<JobDto>>> GetJob(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var job = await _getJobsUseCase.GetByIdAsync(id, cancellationToken);

        if (job == null)
            return NotFound(ApiResponse<JobDto>.Fail($"Job with ID {id} not found"));

        return Ok(ApiResponse<JobDto>.Ok(job));
    }

    [HttpPost("ingest")]
    public async Task<ActionResult<ApiResponse<IngestResultDto>>> IngestJobs(
        [FromBody] List<CreateJobDto> jobs,
        CancellationToken cancellationToken = default)
    {
        if (jobs == null || jobs.Count == 0)
            return BadRequest(ApiResponse<IngestResultDto>.Fail("Request body cannot be empty"));

        if (jobs.Count > 100)
            return BadRequest(ApiResponse<IngestResultDto>.Fail("Maximum 100 jobs per request"));

        var result = await _ingestJobsUseCase.ExecuteAsync(jobs, cancellationToken);
        
        var message = result.Failed > 0
            ? $"{result.Created} jobs created, {result.Duplicates} duplicates, {result.Failed} failed"
            : $"{result.Created} jobs ingested successfully";

        return Ok(ApiResponse<IngestResultDto>.Ok(result, message));
    }
}
