using JobAutomation.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobAutomation.Infrastructure.Data.Configurations;

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(c => c.Website)
            .HasMaxLength(500);

        builder.Property(c => c.Industry)
            .HasMaxLength(200);

        builder.Property(c => c.Location)
            .HasMaxLength(200);

        builder.Property(c => c.LogoUrl)
            .HasMaxLength(1000);

        builder.Property(c => c.Description)
            .HasColumnType("text");

        builder.HasIndex(c => c.Name).IsUnique();
    }
}
