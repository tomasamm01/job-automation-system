using System.Text.RegularExpressions;

namespace JobAutomation.Core.Services;

public static class UrlNormalizer
{
    private static readonly Regex TrackingParamsRegex = new(
        @"[?&](utm_\w+|ref|source|campaign|fbclid|gclid|mc_[a-z]+|_ga|trk|trackingId)=[^&]*",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static string? Normalize(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        try
        {
            var uri = new Uri(url.Trim());
            
            var scheme = uri.Scheme.ToLowerInvariant();
            var host = uri.Host.ToLowerInvariant();
            var path = uri.AbsolutePath.TrimEnd('/');
            
            if (host.StartsWith("www."))
                host = host[4..];

            var cleanUrl = $"{scheme}://{host}{path}";
            
            cleanUrl = TrackingParamsRegex.Replace(cleanUrl, string.Empty);
            
            if (cleanUrl.Contains('?') && cleanUrl.EndsWith("?"))
                cleanUrl = cleanUrl.TrimEnd('?');

            return cleanUrl.ToLowerInvariant();
        }
        catch
        {
            return url.Trim().ToLowerInvariant();
        }
    }
}
