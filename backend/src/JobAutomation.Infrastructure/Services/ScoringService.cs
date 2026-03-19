using JobAutomation.Core.Entities;
using JobAutomation.Core.Interfaces.Services;

namespace JobAutomation.Infrastructure.Services;

public class ScoringService : IScoringService
{
    public Task<double> CalculateRelevanceScoreAsync(Job job, CancellationToken cancellationToken = default)
    {
        double score = 50.0;

        if (!string.IsNullOrWhiteSpace(job.Description))
            score += 10;

        if (!string.IsNullOrWhiteSpace(job.Requirements))
            score += 10;

        if (!string.IsNullOrWhiteSpace(job.SalaryRange))
            score += 10;

        if (job.WorkMode == Core.Enums.WorkMode.Remote)
            score += 10;

        if (!string.IsNullOrWhiteSpace(job.Location))
            score += 5;

        if (!string.IsNullOrWhiteSpace(job.SourceUrl))
            score += 5;

        return Task.FromResult(Math.Min(score, 100.0));
    }

    public Task<IEnumerable<Job>> RankJobsByRelevanceAsync(
        IEnumerable<Job> jobs,
        CancellationToken cancellationToken = default)
    {
        var rankedJobs = jobs.OrderByDescending(j => j.RelevanceScore).ToList();
        return Task.FromResult<IEnumerable<Job>>(rankedJobs);
    }
}
