using JobAutomation.Core.Entities;

namespace JobAutomation.Core.Interfaces.Repositories;

public interface ICompanyRepository : IRepository<Company>
{
    Task<Company?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<Company?> GetWithJobsAsync(Guid id, CancellationToken cancellationToken = default);
}
