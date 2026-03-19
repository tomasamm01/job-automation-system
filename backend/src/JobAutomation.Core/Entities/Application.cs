using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Entities;

public class Application : BaseEntity
{
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    public DateTime AppliedAt { get; set; }
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
    public string? Notes { get; set; }
    public DateTime? ResponseDate { get; set; }
    public DateTime? InterviewDate { get; set; }
}
