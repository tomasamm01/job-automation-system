using JobAutomation.Core.DTOs;
using JobAutomation.Core.DTOs.Common;
using JobAutomation.Core.Interfaces;

namespace JobAutomation.Core.UseCases.Jobs;

public class GetJobsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetJobsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<JobListDto>> ExecuteAsync(
        JobFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var jobs = await _unitOfWork.Jobs.GetJobsWithFiltersAsync(
            filter.Keyword,
            filter.JobType,
            filter.WorkMode,
            filter.Location,
            filter.Status,
            filter.MinRelevanceScore,
            filter.Page,
            filter.PageSize,
            cancellationToken);

        var totalCount = await _unitOfWork.Jobs.GetTotalCountAsync(cancellationToken);

        var jobDtos = jobs.Select(j => new JobListDto(
            j.Id,
            j.Title,
            j.Location,
            j.JobType,
            j.WorkMode,
            j.SalaryRange,
            j.Status,
            j.RelevanceScore,
            j.CreatedAt,
            j.Company.Name
        ));

        return new PagedResult<JobListDto>(
            jobDtos,
            totalCount,
            filter.Page,
            filter.PageSize);
    }

    public async Task<JobDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var job = await _unitOfWork.Jobs.GetWithCompanyAsync(id, cancellationToken);

        if (job == null)
            return null;

        return new JobDto(
            job.Id,
            job.Title,
            job.Description,
            job.Requirements,
            job.Location,
            job.JobType,
            job.WorkMode,
            job.SalaryRange,
            job.Source,
            job.SourceUrl,
            job.Status,
            job.RelevanceScore,
            job.CreatedAt,
            job.ExpiresAt,
            new CompanyDto(
                job.Company.Id,
                job.Company.Name,
                job.Company.Website,
                job.Company.Industry,
                job.Company.Location,
                job.Company.LogoUrl
            )
        );
    }
}
