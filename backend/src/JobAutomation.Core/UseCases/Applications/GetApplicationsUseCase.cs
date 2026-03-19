using JobAutomation.Core.DTOs;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Exceptions;
using JobAutomation.Core.Interfaces;

namespace JobAutomation.Core.UseCases.Applications;

public class GetApplicationsUseCase
{
    private readonly IUnitOfWork _unitOfWork;

    public GetApplicationsUseCase(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ApplicationListDto>> ExecuteAsync(
        ApplicationStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var applications = status.HasValue
            ? await _unitOfWork.Applications.GetByStatusAsync(status.Value, cancellationToken)
            : await _unitOfWork.Applications.GetAllAsync(cancellationToken);

        var result = new List<ApplicationListDto>();

        foreach (var app in applications)
        {
            var appWithJob = await _unitOfWork.Applications.GetWithJobAsync(app.Id, cancellationToken);
            if (appWithJob != null)
            {
                result.Add(new ApplicationListDto(
                    appWithJob.Id,
                    appWithJob.Job.Title,
                    appWithJob.Job.Company.Name,
                    appWithJob.Status,
                    appWithJob.AppliedAt,
                    appWithJob.InterviewDate
                ));
            }
        }

        return result.OrderByDescending(a => a.AppliedAt);
    }

    public async Task<ApplicationDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var application = await _unitOfWork.Applications.GetWithJobAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Application with ID {id} not found");

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
