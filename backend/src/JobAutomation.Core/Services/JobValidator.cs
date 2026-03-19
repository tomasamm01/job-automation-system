using JobAutomation.Core.DTOs;

namespace JobAutomation.Core.Services;

public static class JobValidator
{
    public static (bool IsValid, string? Error) Validate(CreateJobDto job)
    {
        if (string.IsNullOrWhiteSpace(job.Title))
            return (false, "Title is required");

        if (job.Title.Length > 500)
            return (false, "Title cannot exceed 500 characters");

        if (string.IsNullOrWhiteSpace(job.Source))
            return (false, "Source is required");

        if (job.Source.Length > 100)
            return (false, "Source cannot exceed 100 characters");

        if (job.Company == null)
            return (false, "Company is required");

        if (string.IsNullOrWhiteSpace(job.Company.Name))
            return (false, "Company name is required");

        if (job.Company.Name.Length > 300)
            return (false, "Company name cannot exceed 300 characters");

        if (!string.IsNullOrWhiteSpace(job.SourceUrl) && !IsValidUrl(job.SourceUrl))
            return (false, "SourceUrl is not a valid URL");

        if (job.ExternalId?.Length > 200)
            return (false, "ExternalId cannot exceed 200 characters");

        if (job.Description?.Length > 50000)
            return (false, "Description cannot exceed 50000 characters");

        if (job.Requirements?.Length > 50000)
            return (false, "Requirements cannot exceed 50000 characters");

        return (true, null);
    }

    private static bool IsValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) 
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
