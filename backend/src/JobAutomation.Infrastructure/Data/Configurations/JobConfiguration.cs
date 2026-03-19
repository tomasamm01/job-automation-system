using JobAutomation.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobAutomation.Infrastructure.Data.Configurations;

public class JobConfiguration : IEntityTypeConfiguration<Job>
{
    public void Configure(EntityTypeBuilder<Job> builder)
    {
        builder.ToTable("Jobs");

        builder.HasKey(j => j.Id);

        builder.Property(j => j.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(j => j.Description)
            .HasColumnType("text");

        builder.Property(j => j.Requirements)
            .HasColumnType("text");

        builder.Property(j => j.Location)
            .HasMaxLength(200);

        builder.Property(j => j.SalaryRange)
            .HasMaxLength(100);

        builder.Property(j => j.ExternalId)
            .HasMaxLength(200);

        builder.Property(j => j.SourceUrl)
            .HasMaxLength(1000);

        builder.Property(j => j.NormalizedUrl)
            .HasMaxLength(500);

        builder.Property(j => j.Source)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(j => j.JobType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(j => j.WorkMode)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(j => j.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasOne(j => j.Company)
            .WithMany(c => c.Jobs)
            .HasForeignKey(j => j.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(j => j.ExternalId);
        builder.HasIndex(j => j.Source);
        builder.HasIndex(j => j.Status);
        builder.HasIndex(j => j.RelevanceScore);
        builder.HasIndex(j => j.CreatedAt);
        builder.HasIndex(j => new { j.ExternalId, j.Source })
            .IsUnique()
            .HasFilter("\"ExternalId\" IS NOT NULL");
        builder.HasIndex(j => j.NormalizedUrl)
            .HasFilter("\"NormalizedUrl\" IS NOT NULL");
    }
}
