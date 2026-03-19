namespace JobAutomation.Core.DTOs;

public record CompanyDto(
    Guid Id,
    string Name,
    string? Website,
    string? Industry,
    string? Location,
    string? LogoUrl
);

public record CreateCompanyDto(
    string Name,
    string? Website = null,
    string? Industry = null,
    string? Location = null,
    string? LogoUrl = null,
    string? Description = null
);
