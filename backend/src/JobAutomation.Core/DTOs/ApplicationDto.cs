using JobAutomation.Core.Enums;

namespace JobAutomation.Core.DTOs;

public record ApplicationDto(
    Guid Id,
    Guid JobId,
    string JobTitle,
    string CompanyName,
    ApplicationStatus Status,
    DateTime AppliedAt,
    string? CoverLetter,
    string? Notes,
    DateTime? ResponseDate,
    DateTime? InterviewDate,
    DateTime CreatedAt
);

public record ApplicationListDto(
    Guid Id,
    string JobTitle,
    string CompanyName,
    ApplicationStatus Status,
    DateTime AppliedAt,
    DateTime? InterviewDate
);

public record CreateApplicationDto(
    Guid JobId,
    string? CoverLetter = null,
    string? ResumeUrl = null,
    string? Notes = null
);

public record UpdateApplicationStatusDto(
    ApplicationStatus Status,
    string? Notes = null,
    DateTime? InterviewDate = null
);
