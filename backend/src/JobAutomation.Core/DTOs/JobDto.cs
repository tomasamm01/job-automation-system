using JobAutomation.Core.Enums;

namespace JobAutomation.Core.DTOs;

public record JobDto(
    Guid Id,
    string Title,
    string? Description,
    string? Requirements,
    string? Location,
    JobType JobType,
    WorkMode WorkMode,
    string? SalaryRange,
    string Source,
    string? SourceUrl,
    JobStatus Status,
    double RelevanceScore,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    CompanyDto Company
);

public record JobListDto(
    Guid Id,
    string Title,
    string? Location,
    JobType JobType,
    WorkMode WorkMode,
    string? SalaryRange,
    JobStatus Status,
    double RelevanceScore,
    DateTime CreatedAt,
    string CompanyName
);

public record CreateJobDto(
    string Title,
    string? Description,
    string? Requirements,
    string? Location,
    JobType JobType,
    WorkMode WorkMode,
    string? SalaryRange,
    string? ExternalId,
    string? SourceUrl,
    string Source,
    DateTime? ExpiresAt,
    CreateCompanyDto Company
);

public record JobFilterDto(
    string? Keyword = null,
    JobType? JobType = null,
    WorkMode? WorkMode = null,
    string? Location = null,
    JobStatus? Status = null,
    double? MinRelevanceScore = null,
    int Page = 1,
    int PageSize = 20
);
