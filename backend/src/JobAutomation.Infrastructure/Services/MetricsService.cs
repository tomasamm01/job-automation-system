using JobAutomation.Core.DTOs;
using JobAutomation.Core.Entities;
using JobAutomation.Core.Enums;
using JobAutomation.Core.Interfaces;
using JobAutomation.Core.Interfaces.Services;

namespace JobAutomation.Infrastructure.Services;

public class MetricsService : IMetricsService
{
    private readonly IUnitOfWork _unitOfWork;

    public MetricsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var totalJobs = await _unitOfWork.Jobs.CountAsync(cancellationToken: cancellationToken);
        var totalApplications = await _unitOfWork.Applications.CountAsync(cancellationToken: cancellationToken);
        
        var pendingApplications = await _unitOfWork.Applications.CountAsync(
            a => a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.Applied,
            cancellationToken);

        var interviewsScheduled = await _unitOfWork.Applications.CountAsync(
            a => a.Status == ApplicationStatus.Interview && a.InterviewDate > DateTime.UtcNow,
            cancellationToken);

        var responseRate = await CalculateRateAsync(
            a => a.ResponseDate != null,
            cancellationToken);

        var interviewRate = await CalculateRateAsync(
            a => a.Status == ApplicationStatus.Interview || 
                 a.Status == ApplicationStatus.Offered || 
                 a.Status == ApplicationStatus.Accepted,
            cancellationToken);

        var offerRate = await CalculateRateAsync(
            a => a.Status == ApplicationStatus.Offered || a.Status == ApplicationStatus.Accepted,
            cancellationToken);

        var jobs = await _unitOfWork.Jobs.GetAllAsync(cancellationToken);
        var avgScore = jobs.Any() ? jobs.Average(j => j.RelevanceScore) : 0;

        var recentActivity = await GetRecentActivityAsync(cancellationToken);

        return new DashboardMetricsDto(
            totalJobs,
            totalApplications,
            pendingApplications,
            interviewsScheduled,
            responseRate,
            interviewRate,
            offerRate,
            Math.Round(avgScore, 2),
            recentActivity
        );
    }

    public async Task RecordJobIngestedAsync(int count, CancellationToken cancellationToken = default)
    {
        var metric = new Metric
        {
            Id = Guid.NewGuid(),
            Type = MetricType.JobsIngested,
            Name = "Jobs Ingested",
            Value = count,
            RecordedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Metrics.AddAsync(metric, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordApplicationSentAsync(CancellationToken cancellationToken = default)
    {
        var metric = new Metric
        {
            Id = Guid.NewGuid(),
            Type = MetricType.ApplicationsSent,
            Name = "Application Sent",
            Value = 1,
            RecordedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Metrics.AddAsync(metric, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateRatesAsync(CancellationToken cancellationToken = default)
    {
        var responseRate = await CalculateRateAsync(a => a.ResponseDate != null, cancellationToken);
        var interviewRate = await CalculateRateAsync(
            a => a.Status == ApplicationStatus.Interview || 
                 a.Status == ApplicationStatus.Offered || 
                 a.Status == ApplicationStatus.Accepted,
            cancellationToken);
        var offerRate = await CalculateRateAsync(
            a => a.Status == ApplicationStatus.Offered || a.Status == ApplicationStatus.Accepted,
            cancellationToken);

        var metrics = new List<Metric>
        {
            new() { Id = Guid.NewGuid(), Type = MetricType.ResponseRate, Name = "Response Rate", Value = responseRate, RecordedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Type = MetricType.InterviewRate, Name = "Interview Rate", Value = interviewRate, RecordedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Type = MetricType.OfferRate, Name = "Offer Rate", Value = offerRate, RecordedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow }
        };

        await _unitOfWork.Metrics.AddRangeAsync(metrics, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<double> CalculateRateAsync(
        System.Linq.Expressions.Expression<Func<Application, bool>> predicate,
        CancellationToken cancellationToken)
    {
        var total = await _unitOfWork.Applications.CountAsync(cancellationToken: cancellationToken);
        if (total == 0) return 0;

        var matching = await _unitOfWork.Applications.CountAsync(predicate, cancellationToken);
        return Math.Round((double)matching / total * 100, 2);
    }

    private async Task<IEnumerable<RecentActivityDto>> GetRecentActivityAsync(CancellationToken cancellationToken)
    {
        var activities = new List<RecentActivityDto>();

        var recentJobs = await _unitOfWork.Jobs.GetRecentJobsAsync(5, cancellationToken);
        foreach (var job in recentJobs)
        {
            activities.Add(new RecentActivityDto(
                "JobIngested",
                $"New job: {job.Title} at {job.Company.Name}",
                job.CreatedAt
            ));
        }

        var recentApps = await _unitOfWork.Applications.GetRecentApplicationsAsync(5, cancellationToken);
        foreach (var app in recentApps)
        {
            activities.Add(new RecentActivityDto(
                "ApplicationSent",
                $"Applied to: {app.Job.Title}",
                app.AppliedAt
            ));
        }

        return activities.OrderByDescending(a => a.Timestamp).Take(10);
    }
}
