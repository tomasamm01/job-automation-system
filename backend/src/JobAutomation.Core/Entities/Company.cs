namespace JobAutomation.Core.Entities;

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }

    public ICollection<Job> Jobs { get; set; } = new List<Job>();
}
