using JobAutomation.Core.Entities;

namespace JobAutomation.Core.Interfaces.Services;

public interface IScoringService
{
    Task<double> CalculateRelevanceScoreAsync(Job job, CancellationToken cancellationToken = default);
    Task<IEnumerable<Job>> RankJobsByRelevanceAsync(IEnumerable<Job> jobs, CancellationToken cancellationToken = default);
}
