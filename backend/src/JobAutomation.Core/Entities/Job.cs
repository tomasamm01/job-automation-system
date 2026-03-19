using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Entities;

public class Job : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public string? Location { get; set; }
    public JobType JobType { get; set; }
    public WorkMode WorkMode { get; set; }
    public string? SalaryRange { get; set; }
    public string? ExternalId { get; set; }
    public string? SourceUrl { get; set; }
    public string? NormalizedUrl { get; set; }
    public string Source { get; set; } = string.Empty;
    public JobStatus Status { get; set; } = JobStatus.Active;
    public double RelevanceScore { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public ICollection<Application> Applications { get; set; } = new List<Application>();
}
