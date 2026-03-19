using JobAutomation.Core.Enums;

namespace JobAutomation.Core.Entities;

public class Metric : BaseEntity
{
    public MetricType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? Metadata { get; set; }
}
