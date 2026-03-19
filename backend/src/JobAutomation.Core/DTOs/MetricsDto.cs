namespace JobAutomation.Core.DTOs;

public record DashboardMetricsDto(
    int TotalJobs,
    int TotalApplications,
    int PendingApplications,
    int InterviewsScheduled,
    double ResponseRate,
    double InterviewRate,
    double OfferRate,
    double AverageRelevanceScore,
    IEnumerable<RecentActivityDto> RecentActivity
);

public record RecentActivityDto(
    string Type,
    string Description,
    DateTime Timestamp
);

public record MetricDto(
    Guid Id,
    string Type,
    string Name,
    double Value,
    DateTime RecordedAt
);
