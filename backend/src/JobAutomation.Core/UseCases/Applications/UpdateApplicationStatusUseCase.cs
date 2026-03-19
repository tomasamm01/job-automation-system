using JobAutomation.Core.DTOs;
using JobAutomation.Core.Exceptions;
using JobAutomation.Core.Interfaces;
using JobAutomation.Core.Interfaces.Services;

namespace JobAutomation.Core.UseCases.Applications;

public class UpdateApplicationStatusUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMetricsService _metricsService;

    public UpdateApplicationStatusUseCase(IUnitOfWork unitOfWork, IMetricsService metricsService)
    {
        _unitOfWork = unitOfWork;
        _metricsService = metricsService;
    }

    public async Task<ApplicationDto> ExecuteAsync(
        Guid applicationId,
        UpdateApplicationStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var application = await _unitOfWork.Applications.GetWithJobAsync(applicationId, cancellationToken)
            ?? throw new NotFoundException($"Application with ID {applicationId} not found");

        application.Status = dto.Status;
        application.UpdatedAt = DateTime.UtcNow;

        if (dto.Notes != null)
            application.Notes = dto.Notes;

        if (dto.InterviewDate.HasValue)
            application.InterviewDate = dto.InterviewDate;

        if (dto.Status == Enums.ApplicationStatus.InReview ||
            dto.Status == Enums.ApplicationStatus.Interview ||
            dto.Status == Enums.ApplicationStatus.Offered ||
            dto.Status == Enums.ApplicationStatus.Rejected)
        {
            application.ResponseDate ??= DateTime.UtcNow;
        }

        _unitOfWork.Applications.Update(application);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _metricsService.UpdateRatesAsync(cancellationToken);

        return new ApplicationDto(
            application.Id,
            application.Job.Id,
            application.Job.Title,
            application.Job.Company.Name,
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
