namespace JobAutomation.Core.DTOs;

public record IngestResultDto(
    int Processed,
    int Created,
    int Duplicates,
    int Failed,
    IReadOnlyList<Guid> CreatedIds,
    IReadOnlyList<IngestErrorDto> Errors
);

public record IngestErrorDto(
    int Index,
    string? ExternalId,
    string Error
);

public record IngestItemResult
{
    public int Index { get; init; }
    public IngestStatus Status { get; init; }
    public Guid? JobId { get; init; }
    public string? Error { get; init; }
    public string? ExternalId { get; init; }
}

public enum IngestStatus
{
    Created,
    Duplicate,
    Failed
}
