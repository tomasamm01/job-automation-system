using JobAutomation.Core.DTOs;
using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Exceptions;
using JobAutomation.Core.Interfaces;
using JobAutomation.Core.Interfaces.Services;

namespace JobAutomation.Core.UseCases.Applications;

public class ApplyToJobUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMetricsService _metricsService;

    public ApplyToJobUseCase(IUnitOfWork unitOfWork, IMetricsService metricsService)
    {
        _unitOfWork = unitOfWork;
        _metricsService = metricsService;
    }

    public async Task<ApplicationDto> ExecuteAsync(
        CreateApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        var job = await _unitOfWork.Jobs.GetWithCompanyAsync(dto.JobId, cancellationToken)
            ?? throw new NotFoundException($"Job with ID {dto.JobId} not found");

        if (job.Status != JobStatus.Active)
            throw new BusinessException("Cannot apply to an inactive job");

        var alreadyApplied = await _unitOfWork.Applications.HasAppliedToJobAsync(dto.JobId, cancellationToken);
        if (alreadyApplied)
            throw new BusinessException("You have already applied to this job");

        var application = new Application
        {
            Id = Guid.NewGuid(),
            JobId = dto.JobId,
            Status = ApplicationStatus.Applied,
            AppliedAt = DateTime.UtcNow,
            CoverLetter = dto.CoverLetter,
            ResumeUrl = dto.ResumeUrl,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Applications.AddAsync(application, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _metricsService.RecordApplicationSentAsync(cancellationToken);

        return new ApplicationDto(
            application.Id,
            job.Id,
            job.Title,
            job.Company.Name,
            application.Status,
            application.AppliedAt,
            application.CoverLetter,
            application.Notes,
            application.ResponseDate,
            application.InterviewDate,
            application.CreatedAt
        );
    }
}
